import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema.ts';
import fs from 'fs';
import path from 'path';

// Directorio local de persistencia para la base de datos embebida PGlite
const dataDir = path.resolve(process.cwd(), '.data/local_pglite');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const client = new PGlite(dataDir);
export const db = drizzle(client, { schema });
export { schema };

/**
 * Inicializa el esquema DDL y siembra datos iniciales si la base está vacía.
 */
export async function initLocalDatabase() {
  // Crear tablas relacionales compatibles con PostgreSQL
  await client.exec(`
    CREATE TABLE IF NOT EXISTS congregations (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      nif TEXT,
      address TEXT,
      postal_code TEXT,
      phone TEXT,
      email TEXT,
      pastor_name TEXT,
      secretary_name TEXT,
      service_schedules TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      congregation_id INTEGER REFERENCES congregations(id),
      assigned_feature TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      congregation_id INTEGER NOT NULL REFERENCES congregations(id),
      member_number TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      photo_url TEXT,
      birth_date TEXT,
      nationality TEXT DEFAULT 'Brasileña',
      id_document TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      admission_date TEXT,
      baptism_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      pastor_responsible TEXT,
      secretary_responsible TEXT,
      department_name TEXT,
      ministerial_function TEXT DEFAULT 'Miembro en Plena Comunión',
      observations TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS member_history (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id),
      change_type TEXT NOT NULL,
      description TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      previous_state TEXT,
      new_state TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS member_documents (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id),
      title TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_url TEXT,
      file_hash TEXT,
      issued_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_templates (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content_template TEXT NOT NULL,
      requires_pastoral_signature BOOLEAN DEFAULT true,
      requires_qr BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS document_requests (
      id SERIAL PRIMARY KEY,
      dossier_number TEXT NOT NULL UNIQUE,
      member_id INTEGER NOT NULL REFERENCES members(id),
      template_code TEXT NOT NULL,
      document_title TEXT NOT NULL,
      congregation_id INTEGER NOT NULL REFERENCES congregations(id),
      status TEXT NOT NULL DEFAULT 'received',
      assigned_to TEXT,
      observations TEXT,
      resolved_at TIMESTAMP,
      verification_token TEXT,
      pdf_generated_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      congregation_id INTEGER REFERENCES congregations(id),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      responsible_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS department_members (
      id SERIAL PRIMARY KEY,
      department_id INTEGER NOT NULL REFERENCES departments(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      role_in_department TEXT DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      congregation_id INTEGER REFERENCES congregations(id),
      title TEXT NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT,
      location TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      responsible_name TEXT,
      max_capacity INTEGER DEFAULT 500,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_attendance (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id),
      member_id INTEGER NOT NULL REFERENCES members(id),
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      confirmed_attendance BOOLEAN DEFAULT false,
      confirmed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_scope TEXT NOT NULL DEFAULT 'global',
      congregation_id INTEGER REFERENCES congregations(id),
      author_name TEXT NOT NULL,
      is_published BOOLEAN DEFAULT true,
      published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS member_requests (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id),
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      is_confidential BOOLEAN DEFAULT false,
      status TEXT NOT NULL DEFAULT 'open',
      assigned_to TEXT,
      response_text TEXT,
      responded_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS digital_credentials (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id) UNIQUE,
      qr_payload_token TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiration_date TEXT,
      status TEXT NOT NULL DEFAULT 'valid',
      apple_wallet_ready BOOLEAN DEFAULT true,
      google_wallet_ready BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read_at TIMESTAMP,
      link_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      congregation_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      ip_address TEXT,
      changes_payload TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migración segura para columnas añadidas
  try {
    await client.exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_feature TEXT;`);
    await client.exec(`ALTER TABLE congregations ADD COLUMN IF NOT EXISTS nif TEXT;`);
  } catch (e) {
    // Columna ya existe o base nueva
  }

  // Semilla de datos si no hay congregaciones
  const countRes = await client.query('SELECT COUNT(*) as count FROM congregations');
  const count = parseInt(String((countRes.rows[0] as any)?.count || '0'), 10);

  if (count === 0) {
    console.log('[Local DB] Sembrando datos iniciales en base de datos local...');

    // 1. Sedes / Congregaciones
    await client.exec(`
      INSERT INTO congregations (code, name, city, address, phone, email, pastor_name, secretary_name, service_schedules) VALUES
      ('CONG-RIO-01', 'AD Madureira — Sede Nacional (Rio de Janeiro)', 'Rio de Janeiro', 'Rua Carvalho de Souza, 182 - Madureira', '+55 (21) 3359-0000', 'sede.rio@admadureira.org', 'Pr. Alexander Vance', 'Pb. Lucas Fonseca', 'Terças: 19h30, Quintas: 19h30, Domingos: 09h e 18h'),
      ('CONG-SPO-02', 'AD Madureira — Catedral do Brás (São Paulo)', 'São Paulo', 'Av. Rangel Pestana, 1024 - Brás', '+55 (11) 3228-0000', 'sede.sp@admadureira.org', 'Pr. Samuel Ferreira', 'Ev. Marcos Vinicius', 'Quartas: 20h, Domingos: 10h e 18h30'),
      ('CONG-BSB-03', 'AD Madureira — Sede Federal (Brasília)', 'Brasília', 'SGA/Sul Quadra 910 - Asa Sul', '+55 (61) 3345-0000', 'sede.df@admadureira.org', 'Pr. Daniel Fonseca', 'Pb. Tiago Ribeiro', 'Terças: 20h, Domingos: 09h30 e 19h');
    `);

    // 2. Usuarios con roles (Root, Pastores Administradores, Secretarios Locales por Filial, Miembros)
    await client.exec(`
      INSERT INTO users (uid, email, name, password_hash, role, congregation_id, status) VALUES
      ('usr_root_master', 'root@admadureira.org', 'Supervisão Geral Eclesiástica (Root)', 'root#master99', 'root', 1, 'active'),
      ('usr_admin_rio', 'admin@admadureira.org', 'Pr. Alexander Vance', 'admin12345', 'admin', 1, 'active'),
      ('usr_admin_sp', 'pastor.sp@admadureira.org', 'Pr. Samuel Ferreira', 'admin12345', 'admin', 2, 'active'),
      ('usr_admin_df', 'pastor.df@admadureira.org', 'Pr. Daniel Fonseca', 'admin12345', 'admin', 3, 'active'),
      ('usr_sec_rio', 'secretario.rio@admadureira.org', 'Pb. Lucas Fonseca (Sec. Rio)', 'sec12345', 'local_secretary', 1, 'active'),
      ('usr_sec_sp', 'secretario.sp@admadureira.org', 'Ev. Marcos Vinicius (Sec. SP)', 'sec12345', 'local_secretary', 2, 'active'),
      ('usr_sec_df', 'secretario.df@admadureira.org', 'Pb. Tiago Ribeiro (Sec. Brasília)', 'sec12345', 'local_secretary', 3, 'active'),
      ('usr_mem_gabriel', 'gabriel.menezes@admadureira.org', 'Gabriel Menezes', 'miembro123', 'member', 1, 'active'),
      ('usr_mem_beatriz', 'beatriz.lima@admadureira.org', 'Beatriz Lima', 'miembro123', 'member', 2, 'pending')
      ON CONFLICT (email) DO NOTHING;
    `);

    // 3. Expedientes de Miembros
    await client.exec(`
      INSERT INTO members (user_id, congregation_id, member_number, first_name, last_name, email, admission_date, baptism_date, status, ministerial_function, department_name, pastor_responsible, secretary_responsible) VALUES
      (5, 1, 'MAD-2026-0001', 'Gabriel', 'Menezes', 'gabriel.menezes@admadureira.org', '2024-03-15', '2022-08-20', 'active', 'Diácono', 'Juventude e Missões', 'Pr. Alexander Vance', 'Pb. Lucas Fonseca'),
      (6, 2, 'MAD-2026-0002', 'Beatriz', 'Lima', 'beatriz.lima@admadureira.org', '2026-03-02', NULL, 'pending', 'Miembro Solicitante', 'Comunión General', 'Pr. Samuel Ferreira', 'Ev. Marcos Vinicius'),
      (NULL, 1, 'MAD-2026-0003', 'Samuel', 'Santos', 'samuel.santos@admadureira.org', '2023-01-10', '2020-04-12', 'active', 'Diácono', 'Corpo Diaconal', 'Pr. Alexander Vance', 'Pb. Lucas Fonseca'),
      (NULL, 2, 'MAD-2026-0004', 'Rodrigo', 'Alencar', 'rodrigo.sp@admadureira.org', '2021-05-18', '2018-11-25', 'active', 'Presbítero', 'Ensino Bíblico', 'Pr. Samuel Ferreira', 'Ev. Marcos Vinicius');
    `);

    // 4. Credenciales Digitales
    await client.exec(`
      INSERT INTO digital_credentials (member_id, qr_payload_token, issue_date, status, apple_wallet_ready, google_wallet_ready) VALUES
      (1, 'ADMAD-SEC-VAL-1-1710500000000', '2024-03-15', 'valid', true, true),
      (3, 'ADMAD-SEC-VAL-3-1710500000000', '2023-01-10', 'valid', true, true),
      (4, 'ADMAD-SEC-VAL-4-1710500000000', '2021-05-18', 'valid', true, true);
    `);

    // 5. Plantillas Documentales Oficiales
    await client.exec(`
      INSERT INTO document_templates (code, title, category, content_template, requires_pastoral_signature, requires_qr) VALUES
      ('cert_membresia', 'Certificado Oficial de Membresía Eclesiástica', 'certificados', 'Certificamos que o membro encontra-se em plena comunhão e arrolado na Assembleia de Deus Ministério de Madureira.', true, true),
      ('carta_recomendacao', 'Carta de Recomendação e Mudança Canônica', 'cartas', 'Recomendamos fraternalmente o amado irmão em Cristo para que seja recebido com toda honra e cuidado pastoral.', true, true),
      ('cert_bautismo', 'Certificado Canônico de Batismo em Águas', 'certificados', 'Certificamos que desceu às águas batismais conforme a confissão de fé e mandamento de Nosso Senhor Jesus Cristo.', true, true);
    `);

    // 6. Solicitudes Documentales de ejemplo
    await client.exec(`
      INSERT INTO document_requests (dossier_number, member_id, template_code, document_title, congregation_id, status, assigned_to, verification_token) VALUES
      ('EXP-DOC-2026-0101', 1, 'cert_membresia', 'Certificado Oficial de Membresía Eclesiástica', 1, 'approved', 'Pb. Lucas Fonseca', 'QR-VERIFY-A94F81C2');
    `);

    // 7. Departamentos eclesiásticos
    await client.exec(`
      INSERT INTO departments (congregation_id, name, description, category, responsible_name) VALUES
      (1, 'Secretaria Geral & Arquivo Histórico', 'Registro canônico, expedição de credenciais e atas eclesiásticas', 'administrativo', 'Pb. Lucas Fonseca'),
      (1, 'Corpo Diaconal & Acolhimento', 'Atendimento às famílias, organização dos cultos e ordenança da Ceia', 'ministerial', 'Diác. Samuel Santos'),
      (2, 'Departamento de Jovens (UMADM)', 'Encontros de juventude, conferências de missões e discipulado', 'juventude', 'Pb. Rodrigo Alencar'),
      (3, 'Escola Bíblica Dominical (EBD)', 'Formação teológica básica e estudos bíblicos contínuos', 'educacao', 'Pr. Daniel Fonseca');
    `);

    // 8. Eventos eclesiásticos
    await client.exec(`
      INSERT INTO events (congregation_id, title, event_type, description, location, starts_at, max_capacity, responsible_name) VALUES
      (1, 'Culto Solene de Santa Ceia Geral', 'service', 'Celebração mensal da comunhão do Corpo de Cristo com recepção de novos membros', 'Templo Sede Rio de Janeiro', '2026-11-08T18:00:00', 800, 'Pr. Alexander Vance'),
      (2, 'Congresso Estadual de Missões Madureira SP', 'congress', 'Conferência de missões transculturais e plantação de igrejas', 'Catedral do Brás - São Paulo', '2026-11-15T09:00:00', 1500, 'Pr. Samuel Ferreira'),
      (3, 'Escola Bíblica de Obreiros e Líderes', 'seminar', 'Treinamento ministerial para diáconos, presbíteros e evangelistas', 'Sede Federal Brasília', '2026-11-22T19:30:00', 400, 'Pr. Daniel Fonseca');
    `);

    // 9. Comunicados oficiales
    await client.exec(`
      INSERT INTO announcements (title, content, target_scope, congregation_id, author_name) VALUES
      ('Convocatória Oficial para a Convenção Nacional CONAMAD 2026', 'A Mesa Diretora convoca todos os pastores presidentes, secretários e obreiros inscritos para a Assembleia Geral Ordinária.', 'global', NULL, 'Secretaria Geral CONAMAD'),
      ('Recadastramento do Rol de Membros e Emissão de Novas Credenciais', 'Pedimos a todos os membros ativos que confirmem seus dados cadastrais para retirada da credencial digital com QR Code.', 'congregation', 1, 'Pr. Alexander Vance');
    `);

    // 10. Auditoría inicial
    await client.exec(`
      INSERT INTO audit_logs (user_name, user_role, action, entity_type) VALUES
      ('Sistema', 'system', 'Inicialização da base de dados local com topologia eclesiástica Madureira', 'system_init');
    `);

    console.log('[Local DB] Base de datos local inicializada y sembrada con éxito.');
  }

  // Asegurar que cada admin / congregación tenga su secretario local registrado y las credenciales demo de Madrid estén activas
  await client.exec(`
    -- Garantizar existencia de la Sede Europa (Madrid) como en el mockup oficial
    INSERT INTO congregations (code, name, city, address, postal_code, phone, email, pastor_name, secretary_name, service_schedules)
    VALUES ('CONG-MAD-04', 'ADM Madureira — Sede Europa (Madrid)', 'Madrid', 'Calle de Atocha, 112 - Centro', '28012', '+34 91 520 0000', 'madrid@admadureira.org', 'Pr. Carlos Oliveira', 'Dc. Tiago Santos', 'Quartas: 20h00, Sábados: 19h30, Domingos: 11h00 e 18h30')
    ON CONFLICT (code) DO NOTHING;

    -- Secretarios Locales por Filial
    INSERT INTO users (uid, email, name, password_hash, role, congregation_id, status) VALUES
    ('usr_sec_rio', 'secretario.rio@admadureira.org', 'Pb. Lucas Fonseca (Sec. Rio)', 'sec12345', 'local_secretary', 1, 'active'),
    ('usr_sec_sp', 'secretario.sp@admadureira.org', 'Ev. Marcos Vinicius (Sec. SP)', 'sec12345', 'local_secretary', 2, 'active'),
    ('usr_sec_df', 'secretario.df@admadureira.org', 'Pb. Tiago Ribeiro (Sec. Brasília)', 'sec12345', 'local_secretary', 3, 'active')
    ON CONFLICT (email) DO NOTHING;

    -- Sede Madrid: Pastor Carlos y Secretario Tiago Santos
    INSERT INTO users (uid, email, name, password_hash, role, congregation_id, status)
    SELECT 'usr_admin_madrid', 'pastor.madrid@admadureira.org', 'Pr. Carlos Oliveira', 'admin12345', 'admin', id, 'active'
    FROM congregations WHERE code = 'CONG-MAD-04'
    ON CONFLICT (email) DO UPDATE SET password_hash = 'admin12345', status = 'active', role = 'admin';

    INSERT INTO users (uid, email, name, password_hash, role, congregation_id, status)
    SELECT 'usr_sec_madrid', 'secretario.madrid@admadureira.org', 'Dc. Tiago Santos (Sec. Madrid)', 'sec12345', 'local_secretary', id, 'active'
    FROM congregations WHERE code = 'CONG-MAD-04'
    ON CONFLICT (email) DO UPDATE SET password_hash = 'sec12345', status = 'active', role = 'local_secretary';

    -- Miembro Madrid: Kaue Barbosa (cuenta activa y aprobada para pruebas)
    INSERT INTO users (uid, email, name, password_hash, role, congregation_id, status)
    SELECT 'usr_mem_kaue', 'kaue.barbosa2022@gmail.com', 'Kaue Barbosa', '17012007Alice', 'member', id, 'active'
    FROM congregations WHERE code = 'CONG-MAD-04'
    ON CONFLICT (email) DO UPDATE SET password_hash = '17012007Alice', status = 'active', role = 'member';

    -- Expediente de Kaue Barbosa en Members
    INSERT INTO members (user_id, congregation_id, member_number, first_name, last_name, email, admission_date, baptism_date, status, ministerial_function, department_name, pastor_responsible, secretary_responsible)
    SELECT 
      u.id, 
      c.id, 
      'MAD-2026-0005', 
      'Kaue', 
      'Barbosa', 
      'kaue.barbosa2022@gmail.com', 
      '2024-01-15', 
      '2022-06-10', 
      'active', 
      'Membro em Plena Comunhão', 
      'Juventude e Louvor', 
      'Pr. Carlos Oliveira', 
      'Dc. Tiago Santos'
    FROM users u
    JOIN congregations c ON c.code = 'CONG-MAD-04'
    WHERE u.email = 'kaue.barbosa2022@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM members WHERE email = 'kaue.barbosa2022@gmail.com');

    UPDATE members SET status = 'active' WHERE email = 'kaue.barbosa2022@gmail.com';

    -- Credencial digital para Kaue Barbosa
    INSERT INTO digital_credentials (member_id, qr_payload_token, issue_date, status, apple_wallet_ready, google_wallet_ready)
    SELECT 
      m.id, 
      'ADMAD-SEC-VAL-KAUE-1710500000000', 
      '2024-01-15', 
      'valid', 
      true, 
      true
    FROM members m
    WHERE m.email = 'kaue.barbosa2022@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM digital_credentials WHERE member_id = m.id);

    -- Actualizar códigos postales en caso de que falten en sedes previas
    UPDATE congregations SET postal_code = '21350-180' WHERE code = 'CONG-RIO-01' AND (postal_code IS NULL OR postal_code = '');
    UPDATE congregations SET postal_code = '03002-000' WHERE code = 'CONG-SPO-02' AND (postal_code IS NULL OR postal_code = '');
    UPDATE congregations SET postal_code = '70390-100' WHERE code = 'CONG-BSB-03' AND (postal_code IS NULL OR postal_code = '');
    UPDATE congregations SET postal_code = '28012' WHERE code = 'CONG-MAD-04' AND (postal_code IS NULL OR postal_code = '');

    -- Insertar eventos públicos adicionales si no existen (incluyendo el Culto Geral del mockup)
    INSERT INTO events (congregation_id, title, event_type, description, location, starts_at, max_capacity, responsible_name)
    SELECT id, 'Culto Geral', 'service', 'Reunião solene de comunhão, adoração e proclamação da Palavra de Deus para toda a família.', 'ADM Madureira Madrid', '2026-11-09T18:00:00', 600, 'Pr. Carlos Oliveira'
    FROM congregations WHERE code = 'CONG-MAD-04'
    AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto Geral' AND location = 'ADM Madureira Madrid');

    INSERT INTO events (congregation_id, title, event_type, description, location, starts_at, max_capacity, responsible_name)
    SELECT id, 'Culto da Família & Louvor', 'service', 'Culto de celebração, adoração e ministração para famílias.', 'Templo Sede Rio de Janeiro', '2026-11-12T19:30:00', 700, 'Pr. Alexander Vance'
    FROM congregations WHERE code = 'CONG-RIO-01'
    AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Culto da Família & Louvor');

    -- Insertar comunicados públicos generales
    INSERT INTO announcements (title, content, target_scope, congregation_id, author_name)
    SELECT 'Horários Especiais de Cultos e Atendimento Pastoral', 'Informamos a toda a comunidade e visitantes que os cultos públicos acontecem regularmente e as secretarias estão abertas para atendimento e oração.', 'global', NULL, 'Secretaria Geral CONAMAD'
    WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Horários Especiais de Cultos e Atendimento Pastoral');

    -- Asegurar plantillas oficiales de cartas en español
    INSERT INTO document_templates (code, title, category, content_template, requires_pastoral_signature, requires_qr) VALUES
    ('carta_recomendacion', 'Carta de Recomendación', 'cartas', 'Recomendamos fraternalmente al hermano(a) en plena comunión para ser recibido(a) con honra y cuidado pastoral.', true, true),
    ('carta_traslado', 'Carta de Traslado de Miembro', 'cartas', 'Concedemos formalmente la Carta de Traslado de Miembro para integración en la congregación receptora.', true, true),
    ('carta_presentacion', 'Carta de Presentación', 'cartas', 'Presentamos oficialmente a nuestro(a) hermano(a) autorizado(a) por el Gabinete Pastoral.', true, true),
    ('carta_invitacion_ministerial', 'Carta de Invitación (Ministerial)', 'cartas', 'Invitación oficial a pastores, predicadores, cantantes y autoridades eclesiásticas.', true, true),
    ('carta_invitacion_evento', 'Carta de Invitación (Invitados / Evento)', 'cartas', 'Invitación formal para ciudadanos invitados a eventos familiares o congregacionales.', true, true)
    ON CONFLICT (code) DO NOTHING;
  `);
}
