-- ============================================================
--  Auth Service · Sistema de Gestão Escolar v3.0
--  Schema: 20261_prjint5_raphaelestrella
--  RODAR ESTE SCRIPT VIA HeidiSQL OU phpMyAdmin
--  antes de iniciar o auth-service pela primeira vez.
-- ============================================================

USE `20261_prjint5_raphaelestrella`;

CREATE TABLE usuario (
    id            CHAR(36)     NOT NULL,
    email         VARCHAR(255) NOT NULL,
    senha_hash    VARCHAR(255) NOT NULL,
    role          ENUM('ADMIN','PROFESSOR','ALUNO') NOT NULL,
    referencia_id CHAR(36)     NULL,
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_email (email)
);

-- Seed: Admin padrão — senha: Admin@123
-- (hash bcrypt custo 10 gerado offline)
INSERT INTO usuario (id, email, senha_hash, role, referencia_id) VALUES
(
    UUID(),
    'admin@escola.com',
    '$2b$10$X5Vk2b3kL9mN1pQ7rS4uOeJ8wY0tH6iA3dF5gC2hE7lM9nP4qR1vU',
    'ADMIN',
    NULL
);

-- Índices
CREATE INDEX idx_usuario_role  ON usuario (role);
CREATE INDEX idx_usuario_ativo ON usuario (ativo);
