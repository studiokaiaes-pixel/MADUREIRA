import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { db, initLocalDatabase } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SessionData {
  userId: number;
  email: string;
  role: string;
  congregationId?: number | null;
  previewTargetAdminId?: string | null;
  createdAt: number;
}

// Mapa de sesiones en memoria
const sessions = new Map<string, SessionData>();

// Helper para auditoría institucional
async function logAuditAction(
  userId: number | undefined,
  userName: string | undefined,
  userRole: string | undefined,
  congregationId: number | undefined,
  action: string,
  entityType?: string,
  entityId?: string,
  changesPayload?: any
) {
  try {
    await db.insert(schema.auditLogs).values({
      userId: userId || null,
      userName: userName || 'Sistema',
      userRole: userRole || 'system',
      congregationId: congregationId || null,
      action,
      entityType: entityType || null,
      entityId: entityId ? String(entityId) : null,
      changesPayload: changesPayload ? JSON.stringify(changesPayload) : null,
    });
  } catch (err) {
    console.error('[Audit Log] Error al registrar auditoría:', err);
  }
}

// Middleware de autenticación
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    congregationId?: number | null;
    assignedFeature?: string | null;
    status: string;
  };
  session?: SessionData;
  token?: string;
}

async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Credencial no proporcionada o inválida' });
    return;
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Sesión expirada o no autorizada' });
    return;
  }

  try {
    const userList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (userList.length === 0) {
      res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
      return;
    }

    const u = userList[0];
    req.user = {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      congregationId: u.congregationId,
      assignedFeature: u.assignedFeature || null,
      status: u.status,
    };
    req.session = session;
    req.token = token;
    next();
  } catch (err) {
    console.error('Error en authMiddleware:', err);
    res.status(500).json({ error: 'Fallo al verificar identidad de usuario' });
  }
}

function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    // Superadmin y Root tienen acceso universal
    if (req.user.role === 'superadmin' || req.user.role === 'root') {
      next();
      return;
    }
    const role = req.user.role;
    if (allowedRoles.includes(role)) {
      next();
      return;
    }
    // Si se requiere pastor o admin y es local_pastor
    if (allowedRoles.includes('admin') && (role === 'local_pastor' || role === 'general_pastor')) {
      next();
      return;
    }
    // Secretario (admin junior): equivalente a local_secretary para miembros y eventos
    if ((allowedRoles.includes('local_secretary') || allowedRoles.includes('secretary')) && (role === 'local_secretary' || role === 'secretary')) {
      next();
      return;
    }
    // Pastor Asesor (admin con una o más funciones asignadas por Root)
    if (role === 'pastor_advisor') {
      const features = (req.user.assignedFeature || 'expedientes')
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      const hasAny = (...codes: string[]) => codes.some((c) => features.includes(c));
      if (
        hasAny('expedientes', 'miembros', 'eventos', 'documentacion', 'comunicaciones', 'credenciales', 'departamentos', 'informes') &&
        (allowedRoles.includes('local_pastor') || allowedRoles.includes('local_secretary') || allowedRoles.includes('admin'))
      ) {
        next();
        return;
      }
      if (
        hasAny('atencion') &&
        (allowedRoles.includes('local_pastor') || allowedRoles.includes('local_secretary'))
      ) {
        next();
        return;
      }
    }
    res.status(403).json({ error: 'Acceso denegado: permisos insuficientes para esta operación' });
  };
}

async function startServer() {
  await initLocalDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // ==========================================
  // RUTAS PÚBLICAS & AUTENTICACIÓN
  // ==========================================

  const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'Rio de Janeiro': { lat: -22.8732, lng: -43.3387 },
    'São Paulo': { lat: -23.5412, lng: -46.6186 },
    'Brasília': { lat: -15.8032, lng: -47.9004 },
    'Madrid': { lat: 40.4168, lng: -3.7038 },
  };

  // GET /api/public/cities (Congregaciones con sede activa)
  app.get('/api/public/cities', async (_req: Request, res: Response): Promise<void> => {
    try {
      const congList = await db
        .select()
        .from(schema.congregations)
        .where(eq(schema.congregations.status, 'active'));

      const formatted = congList.map((c) => ({
        workspaceId: `ws_${c.id}`,
        congregationId: c.id,
        city: c.city,
        churchName: c.name,
        pastorName: c.pastorName || 'Pastor Dirigente',
      }));

      res.json(formatted);
    } catch (err: any) {
      console.error('Error al obtener ciudades públicas:', err);
      res.status(500).json({ error: 'Error al consultar sedes eclesiásticas' });
    }
  });

  // GET /api/public/congregations (Directorio público de iglesias con geolocalización)
  app.get('/api/public/congregations', async (_req: Request, res: Response): Promise<void> => {
    try {
      const congList = await db
        .select()
        .from(schema.congregations)
        .where(eq(schema.congregations.status, 'active'));

      const formatted = congList.map((c) => {
        const coords = CITY_COORDINATES[c.city] || { lat: -14.235, lng: -51.9253 };
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          city: c.city,
          address: c.address,
          postalCode: c.postalCode || '',
          phone: c.phone || '',
          email: c.email || '',
          pastorName: c.pastorName || 'Pastor Dirigente',
          secretaryName: c.secretaryName || 'Secretaría Eclesiástica',
          serviceSchedules: c.serviceSchedules || 'Domingos: 09h e 18h',
          status: c.status,
          lat: coords.lat,
          lng: coords.lng,
          createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
        };
      });

      res.json(formatted);
    } catch (err: any) {
      console.error('Error al obtener congregaciones públicas:', err);
      res.status(500).json({ error: 'Error al consultar directorio público de iglesias' });
    }
  });

  // GET /api/public/congregations/:id (Detalle público integral de una sede)
  app.get('/api/public/congregations/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const congId = parseInt(req.params.id, 10);
      if (isNaN(congId)) {
        res.status(400).json({ error: 'ID de congregación inválido' });
        return;
      }

      const congList = await db
        .select()
        .from(schema.congregations)
        .where(eq(schema.congregations.id, congId))
        .limit(1);

      if (congList.length === 0) {
        res.status(404).json({ error: 'Congregación no encontrada' });
        return;
      }

      const c = congList[0];
      const coords = CITY_COORDINATES[c.city] || { lat: -14.235, lng: -51.9253 };

      const eventsList = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.congregationId, congId))
        .orderBy(desc(schema.events.startsAt))
        .limit(6);

      const announcementsList = await db
        .select()
        .from(schema.announcements)
        .where(
          and(
            eq(schema.announcements.isPublished, true),
            or(eq(schema.announcements.congregationId, congId), eq(schema.announcements.targetScope, 'global'))
          )
        )
        .orderBy(desc(schema.announcements.publishedAt))
        .limit(6);

      const departmentsList = await db
        .select()
        .from(schema.departments)
        .where(eq(schema.departments.congregationId, congId));

      res.json({
        congregation: {
          id: c.id,
          code: c.code,
          name: c.name,
          city: c.city,
          address: c.address,
          postalCode: c.postalCode || '',
          phone: c.phone || '',
          email: c.email || '',
          pastorName: c.pastorName || 'Pastor Dirigente',
          secretaryName: c.secretaryName || 'Secretaría Eclesiástica',
          serviceSchedules: c.serviceSchedules || 'Domingos: 09h e 18h',
          status: c.status,
          lat: coords.lat,
          lng: coords.lng,
          createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
        },
        events: eventsList,
        announcements: announcementsList,
        departments: departmentsList,
      });
    } catch (err: any) {
      console.error('Error al obtener detalle público de congregación:', err);
      res.status(500).json({ error: 'Error al consultar información de la sede' });
    }
  });

  // GET /api/public/events (Eventos y cultos públicos)
  app.get('/api/public/events', async (req: Request, res: Response): Promise<void> => {
    try {
      const { congregationId } = req.query;
      let query = db.select().from(schema.events);

      let eventsList;
      if (congregationId) {
        eventsList = await query
          .where(eq(schema.events.congregationId, parseInt(String(congregationId), 10)))
          .orderBy(desc(schema.events.startsAt));
      } else {
        eventsList = await query.orderBy(desc(schema.events.startsAt)).limit(20);
      }

      // Asociar nombres de congregación
      const congList = await db.select().from(schema.congregations);
      const congMap = new Map(congList.map((c) => [c.id, c.name]));

      const formatted = eventsList.map((ev) => ({
        ...ev,
        congregationName: ev.congregationId ? congMap.get(ev.congregationId) || 'ADM Madureira' : 'ADM Madureira',
      }));

      res.json(formatted);
    } catch (err: any) {
      console.error('Error al obtener eventos públicos:', err);
      res.status(500).json({ error: 'Error al consultar eventos públicos' });
    }
  });

  // GET /api/public/announcements (Comunicados oficiales públicos)
  app.get('/api/public/announcements', async (req: Request, res: Response): Promise<void> => {
    try {
      const { congregationId } = req.query;

      let conditions: any[] = [eq(schema.announcements.isPublished, true)];

      if (congregationId) {
        conditions.push(
          or(
            eq(schema.announcements.congregationId, parseInt(String(congregationId), 10)),
            eq(schema.announcements.targetScope, 'global')
          )
        );
      }

      const list = await db
        .select()
        .from(schema.announcements)
        .where(and(...conditions))
        .orderBy(desc(schema.announcements.publishedAt))
        .limit(20);

      res.json(list);
    } catch (err: any) {
      console.error('Error al obtener comunicados públicos:', err);
      res.status(500).json({ error: 'Error al consultar comunicados oficiales' });
    }
  });

  // GET /api/public/departments (Departamentos eclesiásticos públicos)
  app.get('/api/public/departments', async (req: Request, res: Response): Promise<void> => {
    try {
      const { congregationId } = req.query;

      let list;
      if (congregationId) {
        list = await db
          .select()
          .from(schema.departments)
          .where(eq(schema.departments.congregationId, parseInt(String(congregationId), 10)));
      } else {
        list = await db.select().from(schema.departments).limit(20);
      }

      res.json(list);
    } catch (err: any) {
      console.error('Error al obtener departamentos públicos:', err);
      res.status(500).json({ error: 'Error al consultar departamentos' });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    try {
      const userList = await db
        .select()
        .from(schema.users)
        .where(eq(sql`LOWER(${schema.users.email})`, email.toLowerCase()))
        .limit(1);

      if (userList.length === 0) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      const user = userList[0];
      // Verificación de contraseña
      if (user.passwordHash !== password) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      // Verificación estricta de estado: El Administrador/Pastor debe aprobar la cuenta
      if (user.status === 'pending') {
        res.status(403).json({
          error: 'Su cuenta está en espera de aprobación por el Administrador / Pastor de su iglesia. Una vez que la administración apruebe su solicitud, podrá ingresar para completar los datos de su Ficha Oficial.',
          code: 'ACCOUNT_PENDING_APPROVAL',
        });
        return;
      }

      if (user.status === 'suspended') {
        res.status(403).json({
          error: 'Esta cuenta ha sido suspendida por la administración eclesiástica.',
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      // Si el rol es miembro, comprobar también el estado de su expediente de miembro
      if (user.role === 'member') {
        const memCheck = await db
          .select()
          .from(schema.members)
          .where(eq(schema.members.userId, user.id))
          .limit(1);

        if (memCheck.length > 0 && memCheck[0].status === 'pending') {
          res.status(403).json({
            error: 'Su solicitud de membresía está en proceso de revisión por la Secretaría y Pastor de su iglesia. El Administrador debe aprobarla formalmente antes de que pueda iniciar sesión.',
            code: 'ACCOUNT_PENDING_APPROVAL',
          });
          return;
        }
      }

      const token = 'sec_' + crypto.randomBytes(24).toString('hex');
      sessions.set(token, {
        userId: user.id,
        email: user.email,
        role: user.role,
        congregationId: user.congregationId,
        createdAt: Date.now(),
      });

      // Obtener expediente de miembro y credencial si existen
      const memberList = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.userId, user.id))
        .limit(1);

      const member = memberList[0] || null;
      let credential = null;
      if (member) {
        const credList = await db
          .select()
          .from(schema.digitalCredentials)
          .where(eq(schema.digitalCredentials.memberId, member.id))
          .limit(1);
        credential = credList[0] || null;
      }

      await logAuditAction(
        user.id,
        user.name,
        user.role,
        user.congregationId || undefined,
        'Inicio de sesión en el Sistema de Secretaría',
        'users',
        String(user.id)
      );

      res.json({
        token,
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
          congregationId: user.congregationId,
          assignedFeature: user.assignedFeature || undefined,
          status: user.status,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        },
        member,
        credential,
        isGhost: user.role === 'superadmin' || user.role === 'root',
      });
    } catch (err: any) {
      console.error('Error en /api/auth/login:', err);
      res.status(500).json({ error: 'Fallo al autenticar usuario' });
    }
  });

  // POST /api/auth/register (Registro público de miembro en una ciudad)
  app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    const { email, password, name, cityWorkspaceId } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Nombre, correo y contraseña requeridos' });
      return;
    }

    try {
      // Buscar congregación por cityWorkspaceId o primera activa
      let congregationId = 1;
      if (cityWorkspaceId) {
        const cleanId = parseInt(String(cityWorkspaceId).replace('ws_', ''), 10);
        if (!isNaN(cleanId)) congregationId = cleanId;
      }

      const existingUsers = await db
        .select()
        .from(schema.users)
        .where(eq(sql`LOWER(${schema.users.email})`, email.toLowerCase()))
        .limit(1);

      if (existingUsers.length > 0) {
        res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
        return;
      }

      const uid = 'usr_' + crypto.randomBytes(8).toString('hex');
      const newUser = await db
        .insert(schema.users)
        .values({
          uid,
          email: email.toLowerCase(),
          name,
          passwordHash: password,
          role: 'member',
          congregationId,
          status: 'pending',
        })
        .returning();

      const createdUser = newUser[0];
      const memberNumber = `MAD-${new Date().getFullYear()}-${String(createdUser.id).padStart(4, '0')}`;

      // Crear expediente con estado 'pending'
      const newMember = await db
        .insert(schema.members)
        .values({
          userId: createdUser.id,
          congregationId,
          memberNumber,
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || 'Membro',
          email: email.toLowerCase(),
          nationality: 'Brasileña',
          status: 'pending',
          admissionDate: new Date().toISOString().split('T')[0],
          ministerialFunction: 'Miembro Solicitante',
        })
        .returning();

      // Registro de trazabilidad
      await db.insert(schema.memberHistory).values({
        memberId: newMember[0].id,
        changeType: 'registration_request',
        description: 'Solicitud de registro remitida desde el portal público de Secretaría',
        performedBy: name,
        previousState: 'none',
        newState: 'pending',
      });

      await logAuditAction(
        createdUser.id,
        name,
        'member',
        congregationId,
        'Solicitud de nuevo miembro registrada',
        'members',
        String(newMember[0].id)
      );

      res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Solicitud de registro enviada. Su expediente está pendiente de homologación por la Secretaría.',
      });
    } catch (err: any) {
      console.error('Error en /api/auth/register:', err);
      res.status(500).json({ error: 'Fallo al procesar registro: ' + err.message });
    }
  });

  // POST /api/auth/approve-demo (Simulación de aprobación pastoral para pruebas)
  app.post('/api/auth/approve-demo', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email requerido' });
        return;
      }

      const userList = await db
        .select()
        .from(schema.users)
        .where(eq(sql`LOWER(${schema.users.email})`, email.toLowerCase()))
        .limit(1);

      if (userList.length === 0) {
        res.status(404).json({ error: 'No se encontró la cuenta con el correo proporcionado' });
        return;
      }

      const u = userList[0];
      await db.update(schema.users).set({ status: 'active' }).where(eq(schema.users.id, u.id));
      await db.update(schema.members).set({ status: 'active' }).where(eq(schema.members.userId, u.id));

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        u.congregationId || 1,
        `Membresía aprobada formalmente para ${u.name} (${u.email})`,
        'members',
        String(u.id)
      );

      res.json({
        success: true,
        message: `¡Cuenta de ${u.name} aprobada formalmente! Ya puede iniciar sesión para completar los datos de su Ficha Oficial.`,
      });
    } catch (err: any) {
      console.error('Error en /api/auth/approve-demo:', err);
      res.status(500).json({ error: 'Error al aprobar cuenta: ' + err.message });
    }
  });

  // POST /api/auth/recover-password
  // Valida identidad canónica por documento, actualiza contraseña y notifica al Pastor / Admin de la filial
  app.post('/api/auth/recover-password', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, idDocument, newPassword } = req.body;

      if (!email || !idDocument || !newPassword) {
        res.status(400).json({ error: 'Todos los campos son obligatorios: e-mail, documento de identidad y nueva contraseña.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanDocInput = idDocument.trim().replace(/[\s\.\-\/]/g, '').toUpperCase();

      const userList = await db
        .select()
        .from(schema.users)
        .where(eq(sql`LOWER(${schema.users.email})`, cleanEmail))
        .limit(1);

      if (userList.length === 0) {
        res.status(404).json({ error: 'No se encontró ningún miembro o usuario registrado con este correo electrónico.' });
        return;
      }

      const user = userList[0];

      // Buscar expediente en tabla members
      const memberList = await db
        .select()
        .from(schema.members)
        .where(or(
          eq(schema.members.userId, user.id),
          eq(sql`LOWER(${schema.members.email})`, cleanEmail)
        ))
        .limit(1);

      const member = memberList[0] || null;

      // Si el miembro tiene documento registrado, validar que coincida
      if (member && member.idDocument && member.idDocument.trim().length > 0) {
        const cleanSavedDoc = member.idDocument.trim().replace(/[\s\.\-\/]/g, '').toUpperCase();
        if (cleanSavedDoc !== cleanDocInput) {
          res.status(403).json({
            error: 'El número de documento proporcionado no coincide con el expediente canónico registrado para este miembro.'
          });
          return;
        }
      } else if (member) {
        // Si no tenía documento registrado aún, registrarlo con el documento validado
        await db
          .update(schema.members)
          .set({ idDocument: idDocument.trim() })
          .where(eq(schema.members.id, member.id));
      }

      // Actualizar la contraseña del usuario
      await db
        .update(schema.users)
        .set({ passwordHash: newPassword })
        .where(eq(schema.users.id, user.id));

      // Obtener congregación para identificar el pastor responsable
      const congList = user.congregationId
        ? await db.select().from(schema.congregations).where(eq(schema.congregations.id, user.congregationId)).limit(1)
        : [];
      const cong = congList[0] || null;
      const pastorName = cong?.pastorName || 'Pastor Dirigente';

      // 1. Notificación en bandeja de avisos (schema.notifications) para pastores y administradores
      const adminUsers = await db
        .select()
        .from(schema.users)
        .where(or(
          eq(schema.users.role, 'local_pastor'),
          eq(schema.users.role, 'general_pastor'),
          eq(schema.users.role, 'admin'),
          eq(schema.users.role, 'superadmin'),
          eq(schema.users.role, 'root')
        ));

      for (const adm of adminUsers) {
        if (!adm.congregationId || adm.congregationId === user.congregationId || adm.role === 'admin' || adm.role === 'superadmin') {
          try {
            await db.insert(schema.notifications).values({
              userId: adm.id,
              title: `Alerta Canónica: Recuperación de Contraseña de ${user.name}`,
              message: `El miembro ${user.name} (${user.email}) de la filial ${cong?.city || 'Local'} validó su identidad con el documento ${idDocument.trim()} y actualizó su contraseña.`,
              type: 'warning',
            });
          } catch (notifErr) {
            console.error('[Notification] Error al insertar aviso:', notifErr);
          }
        }
      }

      // 2. Registro formal en Peticiones / Expediente de Secretaría (schema.memberRequests)
      if (member) {
        try {
          await db.insert(schema.memberRequests).values({
            memberId: member.id,
            category: 'admin_inquiry',
            subject: `[Seguridad Eclesiástica] Cambio de Contraseña de ${user.name}`,
            description: `Aviso oficial para el ${pastorName}: El miembro ${user.name} (${user.email}) ha redefinido su contraseña mediante validación de su documento de identidad (${idDocument.trim()}). Registro canónico auditado.`,
            isConfidential: true,
            status: 'open',
          });
        } catch (reqErr) {
          console.error('[MemberRequest] Error al registrar aviso:', reqErr);
        }
      }

      // 3. Registro de auditoría institucional (schema.auditLogs)
      await logAuditAction(
        user.id,
        user.name,
        user.role,
        user.congregationId || 1,
        `Recuperación de contraseña validada con documento (${idDocument.trim()}). Aviso remitido al Pastor Dirigente (${pastorName}) y Administración.`,
        'auth_recovery',
        String(user.id),
        { email: user.email, documentVerified: true, pastorNotified: pastorName }
      );

      res.json({
        success: true,
        message: `¡Contraseña redefinida exitosamente! Se ha validado su documento canónico y se ha remitido la notificación formal de seguridad a su Pastor Dirigente (${pastorName}) y a la Secretaría de su Filial.`,
        pastorName,
      });
    } catch (err: any) {
      console.error('Error en /api/auth/recover-password:', err);
      res.status(500).json({ error: 'Error al procesar recuperación de contraseña: ' + err.message });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const memberList = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.userId, u.id))
        .limit(1);

      const member = memberList[0] || null;
      let credential = null;
      if (member) {
        const credList = await db
          .select()
          .from(schema.digitalCredentials)
          .where(eq(schema.digitalCredentials.memberId, member.id))
          .limit(1);
        credential = credList[0] || null;
      }

      let congregation = null;
      if (u.congregationId) {
        const congRows = await db
          .select()
          .from(schema.congregations)
          .where(eq(schema.congregations.id, u.congregationId))
          .limit(1);
        congregation = congRows[0] || null;
      }

      res.json({
        user: u,
        member,
        credential,
        congregation,
        preview: req.session?.previewTargetAdminId
          ? {
              isActive: true,
              targetAdminId: req.session.previewTargetAdminId,
            }
          : null,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al recuperar perfil' });
    }
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
    if (req.token) {
      sessions.delete(req.token);
    }
    res.json({ success: true, message: 'Sesión finalizada con éxito' });
  });

  // ==========================================
  // DASHBOARD DE SECRETARÍA & ESTADÍSTICAS
  // ==========================================
  app.get('/api/secretary/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);
      const congFilter = !isGlobal && u.congregationId ? eq(schema.members.congregationId, u.congregationId) : undefined;

      const allMembers = congFilter
        ? await db.select().from(schema.members).where(congFilter)
        : await db.select().from(schema.members);

      const totalMembers = allMembers.length;
      const activeMembers = allMembers.filter((m) => m.status === 'active').length;
      const pendingMembers = allMembers.filter((m) => m.status === 'pending').length;
      const transferredMembers = allMembers.filter((m) => m.status === 'transferred').length;

      const congregationsCount = (await db.select().from(schema.congregations)).length;
      const departmentsCount = (await db.select().from(schema.departments)).length;

      const docRequests = await db.select().from(schema.documentRequests);
      const pendingDocs = docRequests.filter((d) => d.status === 'received' || d.status === 'under_review' || d.status === 'in_preparation').length;
      const approvedDocs = docRequests.filter((d) => d.status === 'approved' || d.status === 'delivered').length;

      const upcomingEvents = (await db.select().from(schema.events)).length;
      const recentAudit = await db
        .select()
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(8);

      res.json({
        totalMembers,
        activeMembers,
        pendingMembers,
        transferredMembers,
        totalCongregations: congregationsCount,
        totalDepartments: departmentsCount,
        pendingDocumentRequests: pendingDocs,
        approvedDocumentRequests: approvedDocs,
        upcomingEvents,
        recentAuditLogs: recentAudit,
      });
    } catch (err: any) {
      console.error('Error al calcular estadísticas de secretaría:', err);
      res.status(500).json({ error: 'Error al generar panel de secretaría' });
    }
  });

  // ==========================================
  // GESTIÓN DE MIEMBROS & EXPEDIENTES
  // ==========================================
  app.get('/api/members', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const { search, status, congregationId } = req.query;

      let memberQuery = db.select().from(schema.members);
      const conditions: any[] = [];

      // Filtro estricto de alcance territorial: ningún admin ve miembros de otros admin
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);
      if (u.role === 'member') {
        conditions.push(eq(schema.members.userId, u.id));
      } else if (!isGlobal) {
        // Rol local (pastor local, secretario local, admin de sede): estrictamente su propia congregación
        conditions.push(eq(schema.members.congregationId, u.congregationId || -1));
      } else if (congregationId) {
        conditions.push(eq(schema.members.congregationId, Number(congregationId)));
      }

      if (status) {
        conditions.push(eq(schema.members.status, String(status)));
      }

      if (search) {
        const s = `%${String(search).toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${schema.members.firstName}) LIKE ${s}`,
            sql`LOWER(${schema.members.lastName}) LIKE ${s}`,
            sql`LOWER(${schema.members.memberNumber}) LIKE ${s}`,
            sql`LOWER(${schema.members.email}) LIKE ${s}`
          )
        );
      }

      const memberList = conditions.length > 0
        ? await memberQuery.where(and(...conditions)).orderBy(desc(schema.members.createdAt))
        : await memberQuery.orderBy(desc(schema.members.createdAt));

      // Asignar nombre y datos completos de congregación
      const congList = await db.select().from(schema.congregations);
      const congMap = new Map(congList.map((c) => [c.id, c]));

      const enriched = memberList.map((m) => {
        const c = congMap.get(m.congregationId);
        return {
          ...m,
          congregationName: c?.name || 'Filial Central',
          congregation: c || undefined,
        };
      });

      res.json(enriched);
    } catch (err: any) {
      console.error('Error al consultar miembros:', err);
      res.status(500).json({ error: 'Fallo al listar miembros' });
    }
  });

  // GET /api/members/:id/dossier (Expediente Individual con 5 Pestañas)
  app.get('/api/members/:id/dossier', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const memberId = parseInt(req.params.id, 10);
      if (isNaN(memberId)) {
        res.status(400).json({ error: 'ID de miembro inválido' });
        return;
      }

      const memberList = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, memberId))
        .limit(1);

      if (memberList.length === 0) {
        res.status(404).json({ error: 'Expediente de miembro no encontrado' });
        return;
      }

      const member = memberList[0];
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);
      if (u.role === 'member') {
        if (member.userId !== u.id) {
          res.status(403).json({ error: 'Acceso denegado: solo puede consultar su propio expediente' });
          return;
        }
      } else if (!isGlobal && member.congregationId !== u.congregationId) {
        res.status(403).json({ error: 'Acceso denegado: este expediente pertenece a otra filial eclesiástica' });
        return;
      }

      const cong = await db
        .select()
        .from(schema.congregations)
        .where(eq(schema.congregations.id, member.congregationId))
        .limit(1);

      const history = await db
        .select()
        .from(schema.memberHistory)
        .where(eq(schema.memberHistory.memberId, memberId))
        .orderBy(desc(schema.memberHistory.createdAt));

      const documents = await db
        .select()
        .from(schema.memberDocuments)
        .where(eq(schema.memberDocuments.memberId, memberId))
        .orderBy(desc(schema.memberDocuments.createdAt));

      const requests = await db
        .select()
        .from(schema.documentRequests)
        .where(eq(schema.documentRequests.memberId, memberId))
        .orderBy(desc(schema.documentRequests.createdAt));

      const credList = await db
        .select()
        .from(schema.digitalCredentials)
        .where(eq(schema.digitalCredentials.memberId, memberId))
        .limit(1);

      res.json({
        member: {
          ...member,
          congregationName: cong[0]?.name || 'Filial Principal',
          congregation: cong[0] || undefined,
        },
        history,
        documents,
        requests,
        credential: credList[0] || null,
      });
    } catch (err: any) {
      console.error('Error al consultar expediente:', err);
      res.status(500).json({ error: 'Error al cargar expediente digital' });
    }
  });

  // POST /api/members (Crear Miembro Manualmente)
  app.post('/api/members', authMiddleware, requireRole(['superadmin', 'general_secretary', 'local_secretary', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const congregationId = data.congregationId || req.user?.congregationId || 1;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const memberNumber = data.memberNumber || `MAD-${new Date().getFullYear()}-${randomSuffix}`;

      const newMember = await db
        .insert(schema.members)
        .values({
          congregationId,
          memberNumber,
          firstName: data.firstName || 'Nuevo',
          lastName: data.lastName || 'Miembro',
          photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          birthDate: data.birthDate || null,
          nationality: data.nationality || 'Brasileña',
          idDocument: data.idDocument || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          postalCode: data.postalCode || null,
          admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
          baptismDate: data.baptismDate || null,
          status: data.status || 'active',
          pastorResponsible: data.pastorResponsible || 'Gabinete Pastoral',
          secretaryResponsible: req.user?.name || 'Secretaría Oficial',
          departmentName: data.departmentName || 'Comunión General',
          ministerialFunction: data.ministerialFunction || 'Miembro en Plena Comunión',
          observations: data.observations || null,
        })
        .returning();

      const created = newMember[0];

      // Generar automáticamente la credencial digital
      await db.insert(schema.digitalCredentials).values({
        memberId: created.id,
        qrPayloadToken: `ADMAD-SEC-VAL-${created.id}-${Date.now()}`,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'valid',
        appleWalletReady: true,
        googleWalletReady: true,
      });

      // Trazabilidad
      await db.insert(schema.memberHistory).values({
        memberId: created.id,
        changeType: 'member_created',
        description: `Expediente creado formalmente por ${req.user?.name}`,
        performedBy: req.user?.name || 'Secretaría',
        previousState: 'none',
        newState: created.status,
      });

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        congregationId,
        `Nuevo miembro creado: ${created.firstName} ${created.lastName} (${created.memberNumber})`,
        'members',
        String(created.id)
      );

      res.status(201).json(created);
    } catch (err: any) {
      console.error('Error al crear miembro:', err);
      res.status(500).json({ error: 'Fallo al dar de alta el expediente: ' + err.message });
    }
  });

  // PUT /api/members/:id (Editar Miembro - Secretaría o el propio miembro completando su ficha oficial)
  app.put('/api/members/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      const updates = req.body;

      const [existing] = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, memberId))
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: 'Expediente de miembro no encontrado' });
        return;
      }

      const isStaff = ['superadmin', 'general_secretary', 'local_secretary', 'root'].includes(req.user?.role || '');
      const isOwner = existing.userId === req.user?.id;

      if (!isStaff && !isOwner) {
        res.status(403).json({ error: 'Acceso denegado: no tienes permisos para actualizar este expediente' });
        return;
      }

      const updated = await db
        .update(schema.members)
        .set({
          firstName: updates.firstName !== undefined ? updates.firstName : existing.firstName,
          lastName: updates.lastName !== undefined ? updates.lastName : existing.lastName,
          photoUrl: updates.photoUrl !== undefined ? updates.photoUrl : existing.photoUrl,
          birthDate: updates.birthDate !== undefined ? updates.birthDate : existing.birthDate,
          nationality: updates.nationality !== undefined ? updates.nationality : existing.nationality,
          idDocument: updates.idDocument !== undefined ? updates.idDocument : existing.idDocument,
          phone: updates.phone !== undefined ? updates.phone : existing.phone,
          email: updates.email !== undefined ? updates.email : existing.email,
          address: updates.address !== undefined ? updates.address : existing.address,
          city: updates.city !== undefined ? updates.city : existing.city,
          postalCode: updates.postalCode !== undefined ? updates.postalCode : existing.postalCode,
          admissionDate: updates.admissionDate !== undefined ? updates.admissionDate : existing.admissionDate,
          baptismDate: updates.baptismDate !== undefined ? updates.baptismDate : existing.baptismDate,
          departmentName: updates.departmentName !== undefined ? updates.departmentName : existing.departmentName,
          ministerialFunction: isStaff && updates.ministerialFunction !== undefined ? updates.ministerialFunction : existing.ministerialFunction,
          observations: isStaff && updates.observations !== undefined ? updates.observations : existing.observations,
        })
        .where(eq(schema.members.id, memberId))
        .returning();

      await db.insert(schema.memberHistory).values({
        memberId,
        changeType: isOwner ? 'member_self_update' : 'member_updated',
        description: isOwner
          ? `Ficha canónica completada/actualizada por el propio miembro (${req.user?.name})`
          : `Datos del expediente actualizados por secretaría (${req.user?.name})`,
        performedBy: req.user?.name || (isOwner ? 'Titular del Expediente' : 'Secretaría'),
      });

      res.json(updated[0]);
    } catch (err: any) {
      console.error('Error al actualizar expediente:', err);
      res.status(500).json({ error: 'Error al actualizar expediente' });
    }
  });

  // POST /api/members/:id/transfer (Traslado Oficial de Congregación)
  app.post('/api/members/:id/transfer', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      const { toCongregationId, reason } = req.body;

      const targetCong = await db
        .select()
        .from(schema.congregations)
        .where(eq(schema.congregations.id, Number(toCongregationId)))
        .limit(1);

      if (targetCong.length === 0) {
        res.status(404).json({ error: 'Congregación de destino no existe' });
        return;
      }

      const updated = await db
        .update(schema.members)
        .set({
          congregationId: Number(toCongregationId),
          status: 'active',
          observations: reason ? `Trasladado: ${reason}` : undefined,
        })
        .where(eq(schema.members.id, memberId))
        .returning();

      await db.insert(schema.memberHistory).values({
        memberId,
        changeType: 'congregation_transfer',
        description: `Traslado eclesiástico autorizado hacia ${targetCong[0].name}. Motivo: ${reason || 'Designación pastoral'}`,
        performedBy: req.user?.name || 'Autoridad Eclesiástica',
        newState: `Congregación: ${targetCong[0].name}`,
      });

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        Number(toCongregationId),
        `Traslado de miembro ${memberId} a filial ${targetCong[0].name}`,
        'members',
        String(memberId)
      );

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Fallo al procesar traslado de miembro' });
    }
  });

  app.post('/api/members/:id/status', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      const { status, reason } = req.body;
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      const current = await db.select().from(schema.members).where(eq(schema.members.id, memberId)).limit(1);
      if (current.length === 0) {
        res.status(404).json({ error: 'Miembro no encontrado' });
        return;
      }

      if (!isGlobal && current[0].congregationId !== u.congregationId) {
        res.status(403).json({ error: 'Acceso denegado: no está autorizado a modificar expedientes de otra filial' });
        return;
      }

      const prev = current[0]?.status || 'pending';

      const updated = await db
        .update(schema.members)
        .set({ status })
        .where(eq(schema.members.id, memberId))
        .returning();

      // Si se aprueba, también activar usuario vinculado
      if (status === 'active' && current[0]?.userId) {
        await db
          .update(schema.users)
          .set({ status: 'active' })
          .where(eq(schema.users.id, current[0].userId));
      }

      await db.insert(schema.memberHistory).values({
        memberId,
        changeType: 'status_transition',
        description: `Estado modificado a ${status}. ${reason || ''}`,
        performedBy: req.user?.name || 'Secretaría',
        previousState: prev,
        newState: status,
      });

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        current[0]?.congregationId,
        `Cambio de estado de miembro ${memberId} de ${prev} a ${status}`,
        'members',
        String(memberId)
      );

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al cambiar estado de membresía' });
    }
  });

  // ==========================================
  // SECRETARÍA DOCUMENTAL (Plantillas & Trámites)
  // ==========================================
  app.get('/api/documents/templates', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
      const list = await db
        .select()
        .from(schema.documentTemplates)
        .where(eq(schema.documentTemplates.isActive, true));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar plantillas' });
    }
  });

  app.get('/api/documents/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);
      const isMember = u.role === 'member';
      const statusFilter = typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : null;

      let requests = await db
        .select()
        .from(schema.documentRequests)
        .orderBy(desc(schema.documentRequests.createdAt));

      if (isMember) {
        const mem = await db.select().from(schema.members).where(eq(schema.members.userId, u.id)).limit(1);
        if (mem.length > 0) {
          requests = requests.filter((r) => r.memberId === mem[0].id);
        } else {
          requests = [];
        }
      } else if ((u.role === 'root' || u.role === 'superadmin') && req.session?.previewTargetAdminId) {
        const targetAdmin = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, Number(req.session.previewTargetAdminId)))
          .limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].congregationId) {
          requests = requests.filter((r) => r.congregationId === targetAdmin[0].congregationId);
        }
      } else if (!isGlobal && u.congregationId) {
        requests = requests.filter((r) => r.congregationId === u.congregationId);
      }

      if (statusFilter) {
        requests = requests.filter((r) => r.status === statusFilter);
      }

      const membersList = await db.select().from(schema.members);
      const memberMap = new Map(membersList.map((m) => [m.id, `${m.firstName} ${m.lastName} (${m.memberNumber})`]));
      const memberNumMap = new Map(membersList.map((m) => [m.id, m.memberNumber]));

      const congList = await db.select().from(schema.congregations);
      const congMap = new Map(congList.map((c) => [c.id, c.name]));

      const formatted = requests.map((r) => ({
        ...r,
        memberName: memberMap.get(r.memberId) || 'Miembro Institucional',
        memberNumber: memberNumMap.get(r.memberId) || 'MAD-000',
        congregationName: congMap.get(r.congregationId) || 'Sede Central',
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar solicitudes documentales' });
    }
  });

  app.post('/api/documents/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { templateCode, memberId, observations, documentTitle, status } = req.body;
      let targetMemberId = memberId;

      if (!targetMemberId && req.user?.role === 'member') {
        const m = await db.select().from(schema.members).where(eq(schema.members.userId, req.user.id)).limit(1);
        if (m.length > 0) targetMemberId = m[0].id;
      }

      const member = await db.select().from(schema.members).where(eq(schema.members.id, Number(targetMemberId))).limit(1);
      if (member.length === 0) {
        res.status(404).json({ error: 'Miembro solicitante no encontrado' });
        return;
      }

      const LETTER_TITLE_FALLBACK: Record<string, string> = {
        carta_recomendacion: 'Carta de Recomendación',
        carta_recomendacao: 'Carta de Recomendación',
        carta_traslado: 'Carta de Traslado de Miembro',
        carta_presentacion: 'Carta de Presentación',
        carta_invitacion_ministerial: 'Carta de Invitación (Ministerial)',
        carta_invitacion_evento: 'Carta de Invitación (Invitados / Evento)',
        carta_comunion: 'Carta de Comunión Oficial',
        cert_membresia: 'Certificado Oficial de Membresía Eclesiástica',
        cert_bautismo: 'Certificado Canónico de Batismo em Águas',
      };

      const template = await db.select().from(schema.documentTemplates).where(eq(schema.documentTemplates.code, templateCode)).limit(1);
      const title =
        (typeof documentTitle === 'string' && documentTitle.trim()) ||
        template[0]?.title ||
        LETTER_TITLE_FALLBACK[templateCode] ||
        'Certificado Eclesiástico';

      // Los miembros siempre crean en estado 'received'. Secretaría/Pastor pueden enviar directo a 'pending_approval'.
      const isStaff = req.user?.role !== 'member';
      const initialStatus = isStaff && status === 'pending_approval' ? 'pending_approval' : 'received';

      const dossierNumber = `EXP-DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const verificationToken = `QR-VERIFY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

      const created = await db
        .insert(schema.documentRequests)
        .values({
          dossierNumber,
          memberId: member[0].id,
          templateCode,
          documentTitle: title,
          congregationId: member[0].congregationId,
          status: initialStatus,
          observations: observations || null,
          assignedTo: isStaff ? req.user?.name : null,
          verificationToken,
        })
        .returning();

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        member[0].congregationId,
        `Solicitud documental generada: ${title} (${dossierNumber}) [${initialStatus}]`,
        'document_requests',
        String(created[0].id)
      );

      res.status(201).json(created[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al registrar solicitud documental' });
    }
  });

  app.post('/api/documents/requests/:id/status', authMiddleware, requireRole(['admin', 'superadmin', 'general_secretary', 'general_pastor', 'local_secretary', 'secretary', 'local_pastor', 'pastor_advisor', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const reqId = parseInt(req.params.id, 10);
      const { status, observations } = req.body;
      const u = req.user!;

      const requiresPastorApproval = u.role === 'local_secretary' || u.role === 'secretary' || u.role === 'pastor_advisor';
      if (requiresPastorApproval && ['approved', 'delivered', 'rejected'].includes(status)) {
        res.status(403).json({
          error: 'Secretaría o Pastor Secundario debe enviar el documento al Pastor Titular para su aprobación antes de aprobarlo o enviarlo.',
        });
        return;
      }

      const existing = await db
        .select()
        .from(schema.documentRequests)
        .where(eq(schema.documentRequests.id, reqId))
        .limit(1);

      if (existing.length === 0) {
        res.status(404).json({ error: 'Trámite documental no encontrado' });
        return;
      }

      const updated = await db
        .update(schema.documentRequests)
        .set({
          status,
          observations: observations !== undefined ? observations : existing[0].observations,
          resolvedAt: ['approved', 'delivered', 'rejected'].includes(status) ? new Date() : undefined,
          assignedTo: req.user?.name,
        })
        .where(eq(schema.documentRequests.id, reqId))
        .returning();

      // Si es aprobado o enviado por el Pastor, registrar en memberDocuments evitando duplicados
      if ((status === 'approved' || status === 'delivered') && updated.length > 0) {
        const docItem = updated[0];
        const alreadyArchived = docItem.verificationToken
          ? await db
              .select()
              .from(schema.memberDocuments)
              .where(eq(schema.memberDocuments.fileHash, docItem.verificationToken))
              .limit(1)
          : [];

        if (alreadyArchived.length === 0) {
          await db.insert(schema.memberDocuments).values({
            memberId: docItem.memberId,
            title: docItem.documentTitle,
            documentType: docItem.templateCode,
            fileHash: docItem.verificationToken,
            issuedBy: req.user?.name || 'Gabinete Pastoral',
          });
        }
      }

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        updated[0]?.congregationId,
        `Trámite documental ${reqId} actualizado a estado ${status}`,
        'document_requests',
        String(reqId)
      );

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al cambiar estado documental' });
    }
  });

  // ==========================================
  // CONGREGACIONES / SEDES FILIALES
  // ==========================================
  app.get('/api/congregations', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
      const list = await db.select().from(schema.congregations).orderBy(schema.congregations.id);
      const membersList = await db.select().from(schema.members);

      const countMap = new Map<number, number>();
      for (const m of membersList) {
        countMap.set(m.congregationId, (countMap.get(m.congregationId) || 0) + 1);
      }

      const formatted = list.map((c) => ({
        ...c,
        memberCount: countMap.get(c.id) || 0,
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar congregaciones' });
    }
  });

  app.post('/api/congregations', authMiddleware, requireRole(['superadmin', 'general_secretary', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const code = data.code || `CONG-${data.city.toUpperCase().slice(0, 3)}-${Math.floor(10 + Math.random() * 89)}`;

      const created = await db
        .insert(schema.congregations)
        .values({
          code,
          name: data.name,
          city: data.city,
          address: data.address,
          postalCode: data.postalCode,
          phone: data.phone,
          email: data.email,
          pastorName: data.pastorName,
          secretaryName: data.secretaryName,
          serviceSchedules: data.serviceSchedules || 'Domingo: 09h e 18h',
          status: 'active',
        })
        .returning();

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        created[0].id,
        `Nueva congregación constituida: ${created[0].name} en ${created[0].city}`,
        'congregations',
        String(created[0].id)
      );

      res.status(201).json(created[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al registrar congregación' });
    }
  });

  app.put('/api/congregations/:id', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const congId = parseInt(req.params.id, 10);
      if (isNaN(congId)) {
        res.status(400).json({ error: 'ID de congregación inválido' });
        return;
      }

      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);
      if (!isGlobal && u.congregationId && Number(u.congregationId) !== congId) {
        res.status(403).json({ error: 'No autorizado a modificar los datos de otra congregación' });
        return;
      }

      const data = req.body || {};
      const updated = await db
        .update(schema.congregations)
        .set({
          ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
          ...(data.city !== undefined ? { city: String(data.city).trim() } : {}),
          ...(data.address !== undefined ? { address: String(data.address).trim() } : {}),
          ...(data.postalCode !== undefined ? { postalCode: String(data.postalCode).trim() } : {}),
          ...(data.phone !== undefined ? { phone: String(data.phone).trim() } : {}),
          ...(data.email !== undefined ? { email: String(data.email).trim() } : {}),
          ...(data.pastorName !== undefined ? { pastorName: String(data.pastorName).trim() } : {}),
          ...(data.secretaryName !== undefined ? { secretaryName: String(data.secretaryName).trim() } : {}),
          ...(data.serviceSchedules !== undefined ? { serviceSchedules: String(data.serviceSchedules).trim() } : {}),
        })
        .where(eq(schema.congregations.id, congId))
        .returning();

      if (updated.length === 0) {
        res.status(404).json({ error: 'Congregación no encontrada' });
        return;
      }

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        congId,
        `Actualización de datos institucionales de sede: ${updated[0].name}`,
        'congregations',
        String(congId)
      );

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al actualizar congregación' });
    }
  });

  // ==========================================
  // DEPARTAMENTOS & MINISTERIOS
  // ==========================================
  app.get('/api/departments', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      let list;
      if (!isGlobal && u.congregationId) {
        list = await db
          .select()
          .from(schema.departments)
          .where(or(eq(schema.departments.congregationId, u.congregationId), sql`${schema.departments.congregationId} IS NULL`))
          .orderBy(schema.departments.id);
      } else {
        list = await db.select().from(schema.departments).orderBy(schema.departments.id);
      }

      const congList = await db.select().from(schema.congregations);
      const congMap = new Map(congList.map((c) => [c.id, c.name]));

      const formatted = list.map((d) => ({
        ...d,
        congregationName: d.congregationId ? congMap.get(d.congregationId) || 'Filial Regional' : 'General Institucional',
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar departamentos' });
    }
  });

  app.post('/api/departments', authMiddleware, requireRole(['superadmin', 'general_secretary', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const u = req.user!;
      const isGlobal = ['superadmin', 'root'].includes(u.role);
      const targetCongId = !isGlobal && u.congregationId ? u.congregationId : (data.congregationId || null);

      const created = await db
        .insert(schema.departments)
        .values({
          congregationId: targetCongId,
          name: data.name,
          description: data.description,
          category: data.category || 'ministerial',
          responsibleName: data.responsibleName || u.name,
          status: 'active',
        })
        .returning();

      res.status(201).json(created[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al crear departamento' });
    }
  });

  // ==========================================
  // CULTOS & EVENTOS (AISLAMIENTO ESTRICTO POR IGLESIA)
  // ==========================================
  app.get('/api/events', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      let list;
      if (!isGlobal && u.congregationId) {
        // Estrictamente los eventos y cultos de su propia iglesia
        list = await db
          .select()
          .from(schema.events)
          .where(eq(schema.events.congregationId, u.congregationId))
          .orderBy(desc(schema.events.startsAt));
      } else {
        list = await db.select().from(schema.events).orderBy(desc(schema.events.startsAt));
      }

      const attendance = await db.select().from(schema.eventAttendance);
      const countMap = new Map<number, number>();
      for (const a of attendance) {
        countMap.set(a.eventId, (countMap.get(a.eventId) || 0) + 1);
      }

      const congList = await db.select().from(schema.congregations);
      const congMap = new Map(congList.map((c) => [c.id, c.name]));

      const formatted = list.map((e) => ({
        ...e,
        congregationName: e.congregationId ? congMap.get(e.congregationId) || 'Filial Local' : 'Filial Local',
        attendanceCount: countMap.get(e.id) || 0,
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar eventos de la iglesia' });
    }
  });

  app.post('/api/events', authMiddleware, requireRole(['superadmin', 'general_secretary', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const u = req.user!;
      const isGlobal = ['superadmin', 'root'].includes(u.role);
      const targetCongId = !isGlobal && u.congregationId ? u.congregationId : (data.congregationId || 1);

      const created = await db
        .insert(schema.events)
        .values({
          congregationId: targetCongId,
          title: data.title,
          eventType: data.eventType || 'service',
          description: data.description,
          location: data.location || 'Templo Central',
          startsAt: data.startsAt,
          endsAt: data.endsAt || null,
          responsibleName: data.responsibleName || u.name,
          maxCapacity: data.maxCapacity || 500,
        })
        .returning();

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        targetCongId,
        `Culto/Evento registrado para la filial: ${data.title}`,
        'events',
        String(created[0].id)
      );

      res.status(201).json(created[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al registrar evento' });
    }
  });

  app.post('/api/events/:id/register', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.id, 10);
      const memberId = req.body.memberId;

      await db.insert(schema.eventAttendance).values({
        eventId,
        memberId: Number(memberId),
        confirmedAttendance: true,
        confirmedAt: new Date(),
      });

      res.json({ success: true, message: 'Inscripción confirmada para el evento' });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al registrar inscripción' });
    }
  });

  // ==========================================
  // COMUNICADOS OFICIALES (AISLAMIENTO POR FILIAL)
  // ==========================================
  app.get('/api/announcements', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      let list;
      if (!isGlobal && u.congregationId) {
        list = await db
          .select()
          .from(schema.announcements)
          .where(
            and(
              eq(schema.announcements.isPublished, true),
              or(eq(schema.announcements.congregationId, u.congregationId), eq(schema.announcements.targetScope, 'global'))
            )
          )
          .orderBy(desc(schema.announcements.publishedAt));
      } else {
        list = await db
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.isPublished, true))
          .orderBy(desc(schema.announcements.publishedAt));
      }

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar comunicados' });
    }
  });

  app.post('/api/announcements', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const u = req.user!;
      const isGlobal = ['superadmin', 'root', 'general_secretary', 'general_pastor'].includes(u.role);
      const isRootUser = ['root', 'superadmin'].includes(u.role);
      const targetCongId = !isGlobal && u.congregationId ? u.congregationId : (data.congregationId || null);

      // Regla de autoría e identidad de emisión:
      // - Root o Superadmin: se emite bajo "Soporte del Sistema" (sigilo absoluto, sin revelar cuenta Root)
      // - Administradores / Pastores: "Nombre (Pastor Dirigente)"
      // - Secretarios: "Nombre (Secretaría)"
      let authorName = 'Secretaría Oficial';
      if (isRootUser) {
        authorName = 'Soporte del Sistema';
      } else if (['admin', 'local_pastor', 'general_pastor'].includes(u.role)) {
        authorName = u.name ? `${u.name} (Pastor Dirigente)` : 'Pastor Dirigente';
      } else if (['local_secretary', 'general_secretary'].includes(u.role)) {
        authorName = u.name ? `${u.name} (Secretaría)` : 'Secretaría de la Iglesia';
      }

      const created = await db
        .insert(schema.announcements)
        .values({
          title: data.title,
          content: data.content,
          targetScope: isGlobal ? (data.targetScope || 'global') : 'congregation',
          congregationId: targetCongId,
          authorName: authorName,
          isPublished: true,
        })
        .returning();

      res.status(201).json(created[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al publicar comunicado' });
    }
  });

  // ==========================================
  // ATENCIÓN AL MIEMBRO (Peticiones & Consultas)
  // ==========================================
  app.get('/api/member-requests', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isMember = u.role === 'member';

      let list = await db.select().from(schema.memberRequests).orderBy(desc(schema.memberRequests.createdAt));

      if (isMember) {
        const mem = await db.select().from(schema.members).where(eq(schema.members.userId, u.id)).limit(1);
        if (mem.length > 0) {
          list = list.filter((r) => r.memberId === mem[0].id);
        }
      }

      const membersList = await db.select().from(schema.members);
      const memberMap = new Map(membersList.map((m) => [m.id, `${m.firstName} ${m.lastName}`]));
      const memberNumMap = new Map(membersList.map((m) => [m.id, m.memberNumber]));

      const formatted = list.map((r) => ({
        ...r,
        memberName: memberMap.get(r.memberId) || 'Miembro',
        memberNumber: memberNumMap.get(r.memberId) || 'MAD-000',
      }));

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar peticiones' });
    }
  });

  app.post('/api/member-requests', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { category, subject, description, isConfidential } = req.body;
      let memberId = 1;

      const mem = await db.select().from(schema.members).where(eq(schema.members.userId, req.user!.id)).limit(1);
      if (mem.length > 0) memberId = mem[0].id;

      const created = await db
        .insert(schema.memberRequests)
        .values({
          memberId,
          category,
          subject,
          description,
          isConfidential: Boolean(isConfidential),
          status: 'open',
        })
        .returning();

      res.status(201).json(created[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al enviar petición' });
    }
  });

  app.post('/api/member-requests/:id/respond', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const reqId = parseInt(req.params.id, 10);
      const { responseText } = req.body;

      const updated = await db
        .update(schema.memberRequests)
        .set({
          responseText,
          status: 'answered',
          respondedAt: new Date(),
          assignedTo: req.user?.name,
        })
        .where(eq(schema.memberRequests.id, reqId))
        .returning();

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al responder atención' });
    }
  });

  // ==========================================
  // CREDENCIAL DIGITAL OFICIAL (Carnet con QR)
  // ==========================================
  app.get('/api/members/:id/credential', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      let cred = await db
        .select()
        .from(schema.digitalCredentials)
        .where(eq(schema.digitalCredentials.memberId, memberId))
        .limit(1);

      if (cred.length === 0) {
        // Generar si no existe
        const newCred = await db
          .insert(schema.digitalCredentials)
          .values({
            memberId,
            qrPayloadToken: `ADMAD-SEC-VAL-${memberId}-${Date.now()}`,
            issueDate: new Date().toISOString().split('T')[0],
            status: 'valid',
            appleWalletReady: true,
            googleWalletReady: true,
          })
          .returning();
        res.json(newCred[0]);
        return;
      }

      res.json(cred[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al recuperar credencial digital' });
    }
  });

  // ==========================================
  // AUDITORÍA INSTITUCIONAL INMUTABLE
  // ==========================================
  app.get('/api/audit-logs', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      let logs;
      if (!isGlobal && u.congregationId) {
        logs = await db
          .select()
          .from(schema.auditLogs)
          .where(or(eq(schema.auditLogs.congregationId, u.congregationId), sql`${schema.auditLogs.congregationId} IS NULL`))
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(100);
      } else {
        logs = await db
          .select()
          .from(schema.auditLogs)
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(100);
      }

      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar logs de auditoría' });
    }
  });

  // ==========================================
  // SUPERVISIÓN CENTRAL ROOT / PREVIEW MODE
  // ==========================================
  app.post('/api/root/preview/start', authMiddleware, requireRole(['superadmin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { targetAdminId } = req.body;
      if (req.session) {
        req.session.previewTargetAdminId = targetAdminId;
      }
      let targetName = 'Pastor Administrador';
      try {
        const targetAdmin = await db.select().from(schema.users).where(eq(schema.users.id, Number(targetAdminId))).limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].name) {
          targetName = targetAdmin[0].name;
        }
      } catch {
        // fallback
      }
      res.json({
        success: true,
        message: 'Modo de supervisión activado en sigilo',
        preview: {
          isActive: true,
          targetAdminId,
          targetAdminName: targetName,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/root/preview/stop', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
    if (req.session) {
      req.session.previewTargetAdminId = null;
    }
    res.json({ success: true, message: 'Modo de supervisión desactivado' });
  });

  // ==========================================
  // ESPACIO DE ADMINISTRADOR LOCAL (WORKSPACE)
  // (Estrictamente aislado por sede eclesiástica)
  // ==========================================
  app.get('/api/admin/workspace', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      let congId = u.congregationId;

      if ((u.role === 'root' || u.role === 'superadmin') && req.session?.previewTargetAdminId) {
        const targetAdmin = await db.select().from(schema.users).where(eq(schema.users.id, Number(req.session.previewTargetAdminId))).limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].congregationId) {
          congId = targetAdmin[0].congregationId;
        }
      }

      const congList = await db.select().from(schema.congregations).where(eq(schema.congregations.id, Number(congId || 1))).limit(1);
      const cong = congList[0] || {
        id: 1,
        name: 'Sede Principal Madureira',
        city: 'São Paulo',
        pastorName: 'Pastor Dirigente',
      };

      const membersList = await db.select().from(schema.members).where(eq(schema.members.congregationId, cong.id));
      const recentLogs = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.congregationId, cong.id)).orderBy(desc(schema.auditLogs.createdAt)).limit(10);

      const workspaceMembers = membersList.map((m) => ({
        id: String(m.id),
        name: `${m.firstName} ${m.lastName}`,
        email: m.email || '',
        role: (m.ministerialFunction?.toLowerCase().includes('pastor') || m.ministerialFunction?.toLowerCase().includes('líder') ? 'lead' : 'member') as 'member' | 'lead',
        status: (m.status === 'active' ? 'active' : 'pending') as 'active' | 'pending',
        joinedAt: m.admissionDate || m.createdAt?.toISOString() || new Date().toISOString(),
        addedAt: m.admissionDate || m.createdAt?.toISOString() || new Date().toISOString(),
        congregationId: m.congregationId,
      }));

      res.json({
        id: `ws_${cong.id}`,
        name: cong.name,
        city: cong.city,
        adminId: String(u.id),
        adminName: u.name,
        ownerName: cong.pastorName || u.name,
        enabledFeatures: ['member_management', 'activity_audit', 'workspace_customization'],
        members: workspaceMembers,
        settings: {
          workspaceName: cong.name,
          welcomeNotice: `Secretaría Oficial — ${cong.name} (${cong.city})`,
          accentLabel: cong.city,
          allowMemberSelfInvite: true,
          strictSessionTimeout: 60,
        },
        activityLogs: recentLogs,
      });
    } catch (err: any) {
      console.error('Error al cargar workspace:', err);
      res.status(500).json({ error: 'Error al recuperar espacio del administrador' });
    }
  });

  app.get('/api/admin/congregation', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      let congId = u.congregationId;

      if ((u.role === 'root' || u.role === 'superadmin') && req.session?.previewTargetAdminId) {
        const targetAdmin = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, Number(req.session.previewTargetAdminId)))
          .limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].congregationId) {
          congId = targetAdmin[0].congregationId;
        }
      }

      if (!congId) {
        const firstCong = await db.select().from(schema.congregations).orderBy(schema.congregations.id).limit(1);
        res.json(firstCong[0] || null);
        return;
      }

      const congList = await db
        .select()
        .from(schema.congregations)
        .where(eq(schema.congregations.id, Number(congId)))
        .limit(1);

      res.json(congList[0] || null);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al cargar datos de la iglesia del administrador' });
    }
  });

  app.put('/api/admin/congregation', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      let congId = u.congregationId;

      if ((u.role === 'root' || u.role === 'superadmin') && req.session?.previewTargetAdminId) {
        const targetAdmin = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, Number(req.session.previewTargetAdminId)))
          .limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].congregationId) {
          congId = targetAdmin[0].congregationId;
        }
      }

      if (!congId) {
        const firstCong = await db.select().from(schema.congregations).orderBy(schema.congregations.id).limit(1);
        congId = firstCong[0]?.id || 1;
      }

      const data = req.body || {};
      const updated = await db
        .update(schema.congregations)
        .set({
          ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
          ...(data.city !== undefined ? { city: String(data.city).trim() } : {}),
          ...(data.nif !== undefined ? { nif: String(data.nif).trim() } : {}),
          ...(data.address !== undefined ? { address: String(data.address).trim() } : {}),
          ...(data.postalCode !== undefined ? { postalCode: String(data.postalCode).trim() } : {}),
          ...(data.phone !== undefined ? { phone: String(data.phone).trim() } : {}),
          ...(data.email !== undefined ? { email: String(data.email).trim() } : {}),
          ...(data.pastorName !== undefined ? { pastorName: String(data.pastorName).trim() } : {}),
          ...(data.secretaryName !== undefined ? { secretaryName: String(data.secretaryName).trim() } : {}),
        })
        .where(eq(schema.congregations.id, Number(congId)))
        .returning();

      if (updated.length === 0) {
        res.status(404).json({ error: 'Sede no encontrada' });
        return;
      }

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        Number(congId),
        `Perfil predeterminado de iglesia actualizado: ${updated[0].name}`,
        'congregations',
        String(congId)
      );

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al guardar datos de la iglesia' });
    }
  });

  // ==========================================
  // GESTIÓN DEL SECRETARIO PROPIO DE CADA FILIAL
  // (Cada admin / congregación tiene su propio secretario)
  // ==========================================
  app.get('/api/admin/secretary', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      let congId = u.congregationId;

      if ((u.role === 'root' || u.role === 'superadmin') && req.session?.previewTargetAdminId) {
        const targetAdmin = await db.select().from(schema.users).where(eq(schema.users.id, Number(req.session.previewTargetAdminId))).limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].congregationId) {
          congId = targetAdmin[0].congregationId;
        }
      }

      const secList = await db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.congregationId, Number(congId || 1)), eq(schema.users.role, 'local_secretary')))
        .limit(1);

      if (secList.length === 0) {
        res.json(null);
        return;
      }

      const s = secList[0];
      res.json({
        id: s.id,
        uid: s.uid,
        name: s.name,
        email: s.email,
        role: s.role,
        congregationId: s.congregationId,
        status: s.status,
        createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error al consultar secretario de la filial:', err);
      res.status(500).json({ error: 'Error al consultar secretario de la filial' });
    }
  });

  app.post('/api/admin/secretary', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email) {
        res.status(400).json({ error: 'Nombre y correo del secretario requeridos' });
        return;
      }

      const u = req.user!;
      let congId = u.congregationId;

      if ((u.role === 'root' || u.role === 'superadmin') && req.session?.previewTargetAdminId) {
        const targetAdmin = await db.select().from(schema.users).where(eq(schema.users.id, Number(req.session.previewTargetAdminId))).limit(1);
        if (targetAdmin.length > 0 && targetAdmin[0].congregationId) {
          congId = targetAdmin[0].congregationId;
        }
      }

      const cleanCongId = Number(congId || 1);

      // Verificar si ya existe secretario para esta filial
      const existing = await db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.congregationId, cleanCongId), eq(schema.users.role, 'local_secretary')))
        .limit(1);

      let savedSecretary;

      if (existing.length > 0) {
        // Actualizar datos del secretario de la filial
        const updateData: any = {
          name,
          email: email.toLowerCase(),
        };
        if (password) {
          updateData.passwordHash = password;
        }

        const updated = await db
          .update(schema.users)
          .set(updateData)
          .where(eq(schema.users.id, existing[0].id))
          .returning();

        savedSecretary = updated[0];
      } else {
        // Crear nuevo secretario para esta filial
        const uid = 'sec_' + crypto.randomBytes(6).toString('hex');
        const created = await db
          .insert(schema.users)
          .values({
            uid,
            name,
            email: email.toLowerCase(),
            passwordHash: password || 'sec12345',
            role: 'local_secretary',
            congregationId: cleanCongId,
            status: 'active',
          })
          .returning();

        savedSecretary = created[0];
      }

      // Actualizar nombre de secretario en la congregación
      await db
        .update(schema.congregations)
        .set({ secretaryName: name })
        .where(eq(schema.congregations.id, cleanCongId));

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        cleanCongId,
        `Secretario de la filial asignado/actualizado: ${name} (${email})`,
        'users',
        String(savedSecretary.id)
      );

      res.json({
        id: savedSecretary.id,
        uid: savedSecretary.uid,
        name: savedSecretary.name,
        email: savedSecretary.email,
        role: savedSecretary.role,
        congregationId: savedSecretary.congregationId,
        status: savedSecretary.status,
        createdAt: savedSecretary.createdAt?.toISOString() || new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error al guardar secretario de la filial:', err);
      res.status(500).json({ error: 'Error al actualizar secretario de la filial: ' + err.message });
    }
  });

  app.post('/api/admin/members', authMiddleware, requireRole(['superadmin', 'general_secretary', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, email, role } = req.body;
      const u = req.user!;
      const congId = u.congregationId || 1;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const memberNumber = `MAD-${new Date().getFullYear()}-${randomSuffix}`;
      const parts = (name || 'Nuevo Miembro').trim().split(' ');
      const firstName = parts[0] || name;
      const lastName = parts.slice(1).join(' ') || 'Membro';

      const created = await db.insert(schema.members).values({
        congregationId: congId,
        memberNumber,
        firstName,
        lastName,
        email: email ? email.toLowerCase() : null,
        status: 'active',
        nationality: 'Brasileña',
        admissionDate: new Date().toISOString().split('T')[0],
        ministerialFunction: role === 'lead' ? 'Líder / Obrero' : 'Miembro en Plena Comunión',
      }).returning();

      res.status(201).json({
        id: String(created[0].id),
        name: `${created[0].firstName} ${created[0].lastName}`,
        email: created[0].email || '',
        role: role || 'member',
        status: 'active',
        joinedAt: created[0].admissionDate || new Date().toISOString(),
        addedAt: created[0].admissionDate || new Date().toISOString(),
        congregationId: created[0].congregationId,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al incorporar miembro: ' + err.message });
    }
  });

  app.delete('/api/admin/members/:id', authMiddleware, requireRole(['superadmin', 'general_secretary', 'local_secretary', 'local_pastor', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      const mem = await db.select().from(schema.members).where(eq(schema.members.id, memberId)).limit(1);
      if (mem.length === 0) {
        res.status(404).json({ error: 'Miembro no encontrado' });
        return;
      }

      if (!isGlobal && mem[0].congregationId !== u.congregationId) {
        res.status(403).json({ error: 'No autorizado a eliminar miembros de otra filial' });
        return;
      }

      await db.update(schema.members).set({ status: 'inactive' }).where(eq(schema.members.id, memberId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al remover miembro' });
    }
  });

  app.put('/api/admin/settings', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.json(req.body);
  });

  // ==========================================
  // APROBACIÓN DE REGISTROS DE MIEMBROS
  // (Llegan al admin de su propia sede; Root ve todas)
  // ==========================================
  app.get('/api/admin/pending-registrations', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      const conditions = [eq(schema.members.status, 'pending')];
      if (!isGlobal && u.congregationId) {
        conditions.push(eq(schema.members.congregationId, u.congregationId));
      }

      const pendingMembers = await db
        .select()
        .from(schema.members)
        .where(and(...conditions))
        .orderBy(desc(schema.members.createdAt));

      const congs = await db.select().from(schema.congregations);
      const congMap = new Map(congs.map((c) => [c.id, c]));

      const formatted = pendingMembers.map((m) => {
        const c = congMap.get(m.congregationId);
        return {
          id: String(m.id),
          name: `${m.firstName} ${m.lastName}`,
          email: m.email || '',
          city: c?.city || 'Sede Regional',
          churchName: c?.name || 'AD Madureira',
          pastorName: c?.pastorName || 'Pastor Dirigente',
          congregationId: m.congregationId,
          requestedAt: m.createdAt?.toISOString() || new Date().toISOString(),
          createdAt: m.createdAt?.toISOString() || new Date().toISOString(),
          status: 'pending' as const,
        };
      });

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar registros pendientes' });
    }
  });

  app.get('/api/root/pending-registrations', authMiddleware, requireRole(['superadmin', 'root']), async (_req: Request, res: Response): Promise<void> => {
    try {
      const pendingMembers = await db.select().from(schema.members).where(eq(schema.members.status, 'pending')).orderBy(desc(schema.members.createdAt));
      const congs = await db.select().from(schema.congregations);
      const congMap = new Map(congs.map((c) => [c.id, c]));

      const formatted = pendingMembers.map((m) => {
        const c = congMap.get(m.congregationId);
        return {
          id: String(m.id),
          name: `${m.firstName} ${m.lastName}`,
          email: m.email || '',
          city: c?.city || 'Sede Regional',
          churchName: c?.name || 'AD Madureira',
          pastorName: c?.pastorName || 'Pastor Dirigente',
          congregationId: m.congregationId,
          requestedAt: m.createdAt?.toISOString() || new Date().toISOString(),
          createdAt: m.createdAt?.toISOString() || new Date().toISOString(),
          status: 'pending' as const,
        };
      });

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar registros pendientes para Root' });
    }
  });

  // POST /api/admin/registrations/:id/approve
  app.post('/api/admin/registrations/:id/approve', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      const memList = await db.select().from(schema.members).where(eq(schema.members.id, memberId)).limit(1);
      if (memList.length === 0) {
        res.status(404).json({ error: 'Registro de miembro no encontrado' });
        return;
      }

      const mem = memList[0];
      if (!isGlobal && mem.congregationId !== u.congregationId) {
        res.status(403).json({ error: 'Acceso denegado: este registro pertenece a otra sede eclesiástica' });
        return;
      }

      await db.update(schema.members).set({ status: 'active' }).where(eq(schema.members.id, memberId));
      if (mem.userId) {
        await db.update(schema.users).set({ status: 'active' }).where(eq(schema.users.id, mem.userId));
      }

      // Generar o activar credencial digital
      const cred = await db.select().from(schema.digitalCredentials).where(eq(schema.digitalCredentials.memberId, memberId)).limit(1);
      if (cred.length === 0) {
        await db.insert(schema.digitalCredentials).values({
          memberId,
          qrPayloadToken: `ADMAD-SEC-VAL-${memberId}-${Date.now()}`,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'valid',
          appleWalletReady: true,
          googleWalletReady: true,
        });
      }

      await db.insert(schema.memberHistory).values({
        memberId,
        changeType: 'registration_approved',
        description: `Registro aprobado formalmente por ${u.name} (${u.role})`,
        performedBy: u.name,
        previousState: 'pending',
        newState: 'active',
      });

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        mem.congregationId,
        `Registro de miembro aprobado: ${mem.firstName} ${mem.lastName}`,
        'members',
        String(memberId)
      );

      res.json({ success: true, message: `Registro de ${mem.firstName} ${mem.lastName} aprobado con éxito.` });
    } catch (err: any) {
      console.error('Error al aprobar registro:', err);
      res.status(500).json({ error: 'Fallo al aprobar registro: ' + err.message });
    }
  });

  // POST /api/admin/registrations/:id/reject
  app.post('/api/admin/registrations/:id/reject', authMiddleware, requireRole(['superadmin', 'general_secretary', 'general_pastor', 'local_pastor', 'local_secretary', 'admin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = parseInt(req.params.id, 10);
      const u = req.user!;
      const isGlobal = ['superadmin', 'general_secretary', 'general_pastor', 'root'].includes(u.role);

      const memList = await db.select().from(schema.members).where(eq(schema.members.id, memberId)).limit(1);
      if (memList.length === 0) {
        res.status(404).json({ error: 'Registro de miembro no encontrado' });
        return;
      }

      const mem = memList[0];
      if (!isGlobal && mem.congregationId !== u.congregationId) {
        res.status(403).json({ error: 'Acceso denegado: este registro pertenece a otra sede eclesiástica' });
        return;
      }

      await db.update(schema.members).set({ status: 'inactive' }).where(eq(schema.members.id, memberId));
      if (mem.userId) {
        await db.update(schema.users).set({ status: 'suspended' }).where(eq(schema.users.id, mem.userId));
      }

      await logAuditAction(
        u.id,
        u.name,
        u.role,
        mem.congregationId,
        `Solicitud de registro descartada para: ${mem.firstName} ${mem.lastName}`,
        'members',
        String(memberId)
      );

      res.json({ success: true, message: `Solicitud de registro de ${mem.firstName} ${mem.lastName} descartada.` });
    } catch (err: any) {
      res.status(500).json({ error: 'Fallo al descartar registro: ' + err.message });
    }
  });

  // ==========================================
  // ROOT CONSOLE — GESTIÓN CENTRALIZADA
  // (SOLO EL ROOT PUEDE CREAR ADMIN AUTOMÁTICAMENTE)
  // ==========================================
  app.get('/api/root/admins', authMiddleware, requireRole(['superadmin', 'root']), async (_req: Request, res: Response): Promise<void> => {
    try {
      const admins = await db.select().from(schema.users).where(inArray(schema.users.role, ['admin', 'local_pastor', 'local_secretary', 'pastor_advisor', 'secretary']));
      const congs = await db.select().from(schema.congregations);
      const members = await db.select().from(schema.members);
      const congMap = new Map(congs.map((c) => [c.id, c]));

      const result = admins.map((a) => {
        const c = a.congregationId ? congMap.get(a.congregationId) : null;
        const congMembers = members.filter((m) => m.congregationId === a.congregationId);
        const ws = c ? {
          id: `ws_${c.id}`,
          name: c.name,
          city: c.city,
          adminId: String(a.id),
          adminName: a.name,
          ownerName: c.pastorName || a.name,
          enabledFeatures: ['member_management', 'activity_audit', 'workspace_customization'],
          members: congMembers.map((m) => ({
            id: String(m.id),
            name: `${m.firstName} ${m.lastName}`,
            email: m.email || '',
            role: 'member' as const,
            status: (m.status === 'active' ? 'active' : 'pending') as 'active' | 'pending',
            joinedAt: m.admissionDate || m.createdAt?.toISOString() || new Date().toISOString(),
            addedAt: m.admissionDate || m.createdAt?.toISOString() || new Date().toISOString(),
            congregationId: m.congregationId,
          })),
          settings: {
            workspaceName: c.name,
            welcomeNotice: `Secretaría Oficial ${c.name}`,
            accentLabel: c.city,
            allowMemberSelfInvite: true,
            strictSessionTimeout: 60,
          },
          activityLogs: [],
        } : undefined;

        return {
          admin: {
            id: String(a.id),
            uid: a.uid,
            name: a.name,
            email: a.email,
            role: a.role,
            congregationId: a.congregationId,
            assignedFeature: a.assignedFeature || undefined,
            city: c?.city,
            status: a.status,
            createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
          },
          workspace: ws,
        };
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar administradores' });
    }
  });

  // POST /api/root/admins (CREAR ADMIN, ASESOR O SECRETARIO AUTOMÁTICAMENTE — SOLO ROOT)
  app.post('/api/root/admins', authMiddleware, requireRole(['superadmin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, email, password, city, congregationId, role = 'local_pastor', assignedFeature, workspaceName } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        return;
      }

      let congId: number | null = null;
      let congName: string = '';

      if (congregationId) {
        const found = await db.select().from(schema.congregations).where(eq(schema.congregations.id, Number(congregationId))).limit(1);
        if (found.length > 0) {
          congId = found[0].id;
          congName = found[0].name;
        }
      }

      if (!congId && city) {
        const existingCongs = await db.select().from(schema.congregations).where(eq(sql`LOWER(${schema.congregations.city})`, city.toLowerCase())).limit(1);
        if (existingCongs.length > 0) {
          congId = existingCongs[0].id;
          congName = existingCongs[0].name;
        } else {
          const code = `CONG-${city.toUpperCase().slice(0, 3)}-${Math.floor(10 + Math.random() * 89)}`;
          const createdCong = await db.insert(schema.congregations).values({
            code,
            name: workspaceName || `AD Madureira — Sede ${city}`,
            city,
            pastorName: name,
            status: 'active',
          }).returning();
          congId = createdCong[0].id;
          congName = createdCong[0].name;
        }
      }

      if (!congId) {
        const firstCong = await db.select().from(schema.congregations).limit(1);
        if (firstCong.length > 0) {
          congId = firstCong[0].id;
          congName = firstCong[0].name;
        }
      }

      const existingUser = await db.select().from(schema.users).where(eq(sql`LOWER(${schema.users.email})`, email.toLowerCase())).limit(1);
      if (existingUser.length > 0) {
        res.status(400).json({ error: 'Ya existe un usuario con este correo electrónico' });
        return;
      }

      const normalizedAssignedFeature =
        role === 'pastor_advisor'
          ? (Array.isArray(assignedFeature)
              ? assignedFeature.join(',')
              : String(assignedFeature || 'expedientes'))
          : null;

      const prefix = role === 'secretary' ? 'sec_' : role === 'pastor_advisor' ? 'adv_' : 'adm_';
      const uid = prefix + crypto.randomBytes(6).toString('hex');
      const newAdmin = await db.insert(schema.users).values({
        uid,
        email: email.toLowerCase(),
        name,
        passwordHash: password,
        role: role,
        congregationId: congId,
        assignedFeature: normalizedAssignedFeature,
        status: 'active',
      }).returning();

      const roleLabels: Record<string, string> = {
        local_pastor: 'Pastor Titular (Admin)',
        pastor_advisor: `Pastor Asesor (Funciones: ${normalizedAssignedFeature || 'expedientes'})`,
        secretary: 'Secretario (Admin Junior)',
      };

      await logAuditAction(
        req.user?.id,
        req.user?.name,
        req.user?.role,
        congId || undefined,
        `Usuario aprovisionado por Root [${roleLabels[role] || role}]: ${name} (${congName})`,
        'users',
        String(newAdmin[0].id)
      );

      res.status(201).json({
        success: true,
        admin: newAdmin[0],
        message: `Usuario aprovisionado exitosamente como ${roleLabels[role] || role} para ${congName || 'la sede'}.`,
      });
    } catch (err: any) {
      console.error('Error al aprovisionar admin:', err);
      res.status(500).json({ error: 'Error al aprovisionar usuario eclesiástico' });
    }
  });

  app.put('/api/root/admins/:id/features', authMiddleware, requireRole(['superadmin', 'root']), async (_req: Request, res: Response): Promise<void> => {
    res.json({ success: true });
  });

  app.get('/api/root/config', authMiddleware, requireRole(['superadmin', 'root']), async (_req: Request, res: Response): Promise<void> => {
    res.json({
      requireCitySelection: true,
      maxAdmins: 50,
      systemLock: false,
      strictSessionTimeout: 60,
      maintenanceMode: false,
      stealthTelemetryActive: false,
      databaseDirectSync: true,
      silentErrorSuppression: false,
      allowAdminRegistration: false,
      ephemeralLogPurgeHours: 24,
      memoryCacheMaxMB: 512,
      masterServerNode: 'madureira-eu-west3-core',
      lastPurgedAt: new Date().toISOString(),
    });
  });

  app.post('/api/root/config', authMiddleware, requireRole(['superadmin', 'root']), async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      globalConfig: {
        requireCitySelection: true,
        maxAdmins: 50,
        systemLock: false,
        strictSessionTimeout: 60,
        maintenanceMode: false,
        stealthTelemetryActive: false,
        databaseDirectSync: true,
        silentErrorSuppression: false,
        allowAdminRegistration: false,
        ephemeralLogPurgeHours: 24,
        memoryCacheMaxMB: 512,
        masterServerNode: 'madureira-eu-west3-core',
        ...req.body,
      },
    });
  });

  app.post('/api/root/purge', authMiddleware, requireRole(['superadmin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const purgedAt = new Date().toISOString();
    await logAuditAction(req.user?.id, req.user?.name, req.user?.role, undefined, 'Purga de trazas y memoria efímera ejecutada por Root');
    res.json({ success: true, message: 'Trazas efímeras purgadas del servidor', purgedAt });
  });

  app.post('/api/root/reset-demo', authMiddleware, requireRole(['superadmin', 'root']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await logAuditAction(req.user?.id, req.user?.name, req.user?.role, undefined, 'Reinicio de entorno solicitado por Root');
    res.json({ success: true, message: 'Valores restablecidos' });
  });

  // ==========================================
  // VITE MIDDLEWARE / ARCHIVOS ESTÁTICOS
  // ==========================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ADM Madureira Secretaría] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ADM Madureira Secretaría] Error fatal al iniciar:', err);
});
