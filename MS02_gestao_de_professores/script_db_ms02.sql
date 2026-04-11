-- ============================================================
--  MS-2 · Gestão de Professores · Sistema de Gestão Escolar v3.0
--  Banco: MariaDB (HeidiSQL)
-- ============================================================

CREATE TABLE professor (
    id            CHAR(36)     NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_professor_email (email)
);

-- professor_disciplina e professor_turma registram os vínculos
-- do professor com disciplinas e turmas. disciplina_id e turma_id
-- são referências externas ao MS-3 — sem FK real entre MSs.
CREATE TABLE professor_disciplina (
    id            CHAR(36) NOT NULL,
    professor_id  CHAR(36) NOT NULL,
    disciplina_id CHAR(36) NOT NULL,               -- ref. MS-3
    PRIMARY KEY (id),
    CONSTRAINT fk_pd_professor FOREIGN KEY (professor_id)
        REFERENCES professor (id) ON DELETE CASCADE,
    UNIQUE KEY uq_professor_disciplina (professor_id, disciplina_id)
);

CREATE TABLE professor_turma (
    id            CHAR(36) NOT NULL,
    professor_id  CHAR(36) NOT NULL,
    turma_id      CHAR(36) NOT NULL,               -- ref. MS-3
    disciplina_id CHAR(36) NOT NULL,               -- ref. MS-3
    PRIMARY KEY (id),
    CONSTRAINT fk_pt_professor FOREIGN KEY (professor_id)
        REFERENCES professor (id) ON DELETE CASCADE,
    UNIQUE KEY uq_professor_turma (professor_id, turma_id, disciplina_id)
);

CREATE TABLE grade_horaria (
    id              CHAR(36)  NOT NULL,
    professor_id    CHAR(36)  NOT NULL,
    turma_id        CHAR(36)  NOT NULL,            -- ref. MS-3
    disciplina_id   CHAR(36)  NOT NULL,            -- ref. MS-3
    bimestre        SMALLINT  NOT NULL,
    ano_letivo      YEAR      NOT NULL,
    dia_semana      ENUM('SEGUNDA','TERCA','QUARTA','QUINTA','SEXTA','SABADO') NOT NULL,
    horario_inicio  TIME      NOT NULL,
    horario_fim     TIME      NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_gh_professor FOREIGN KEY (professor_id)
        REFERENCES professor (id) ON DELETE RESTRICT,
    CONSTRAINT chk_bimestre_gh CHECK (bimestre BETWEEN 1 AND 4),
    CONSTRAINT chk_horario     CHECK (horario_fim > horario_inicio),
    UNIQUE KEY uq_grade_horaria (professor_id, turma_id, bimestre, ano_letivo, dia_semana, horario_inicio)
);

-- Registra quando um professor é substituído em um horário específico.
-- data_fim NULL significa que a substituição ainda está ativa.
CREATE TABLE substituicao_professor (
    id                      CHAR(36) NOT NULL,
    grade_horaria_id        CHAR(36) NOT NULL,
    professor_substituto_id CHAR(36) NOT NULL,     -- ref. professor
    motivo                  TEXT,
    data_inicio             DATE     NOT NULL,
    data_fim                DATE     NULL DEFAULT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sp_grade FOREIGN KEY (grade_horaria_id)
        REFERENCES grade_horaria (id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_substituto FOREIGN KEY (professor_substituto_id)
        REFERENCES professor (id) ON DELETE RESTRICT,
    CONSTRAINT chk_datas_subst CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Fila de eventos para o MS-5 (Comunicação).
-- Toda alteração na grade gera um registro aqui.
-- O MS-5 consome os eventos com processado = FALSE e marca como TRUE.
CREATE TABLE evento_grade (
    id               CHAR(36)  NOT NULL,
    grade_horaria_id CHAR(36)  NOT NULL,
    tipo             ENUM('CRIACAO','EDICAO','SUBSTITUICAO') NOT NULL,
    descricao        TEXT,
    processado       BOOLEAN   NOT NULL DEFAULT FALSE,
    publicado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processado_em    TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_eg_grade FOREIGN KEY (grade_horaria_id)
        REFERENCES grade_horaria (id) ON DELETE CASCADE
);

CREATE INDEX idx_professor_nome       ON professor (nome_completo);

CREATE INDEX idx_pd_professor         ON professor_disciplina (professor_id);
CREATE INDEX idx_pd_disciplina        ON professor_disciplina (disciplina_id);

CREATE INDEX idx_pt_professor         ON professor_turma (professor_id);
CREATE INDEX idx_pt_turma             ON professor_turma (turma_id);
CREATE INDEX idx_pt_disciplina        ON professor_turma (disciplina_id);

CREATE INDEX idx_gh_professor         ON grade_horaria (professor_id);
CREATE INDEX idx_gh_turma             ON grade_horaria (turma_id);
CREATE INDEX idx_gh_bimestre_ano      ON grade_horaria (bimestre, ano_letivo);
CREATE INDEX idx_gh_dia_semana        ON grade_horaria (dia_semana);

CREATE INDEX idx_sp_grade             ON substituicao_professor (grade_horaria_id);
CREATE INDEX idx_sp_substituto        ON substituicao_professor (professor_substituto_id);
CREATE INDEX idx_sp_datas             ON substituicao_professor (data_inicio, data_fim);

CREATE INDEX idx_eg_processado        ON evento_grade (processado);
CREATE INDEX idx_eg_publicado_em      ON evento_grade (publicado_em);

-- toda vez que a grade_horaria é criada, editada ou uma
-- substituição é registrada — alimentando o MS-5 (RF-13).

CREATE VIEW vw_grade_professor AS
SELECT
    p.id            AS professor_id,
    p.nome_completo AS professor_nome,
    gh.bimestre,
    gh.ano_letivo,
    gh.dia_semana,
    gh.horario_inicio,
    gh.horario_fim,
    gh.turma_id,
    gh.disciplina_id,
    CASE
        WHEN sp.id IS NOT NULL THEN 'SUBSTITUIDO'
        ELSE 'TITULAR'
    END             AS status_aula,
    sp.professor_substituto_id,
    sp.motivo       AS motivo_substituicao
FROM grade_horaria gh
INNER JOIN professor p  ON p.id  = gh.professor_id
LEFT JOIN substituicao_professor sp
       ON sp.grade_horaria_id = gh.id
      AND sp.data_inicio     <= CURRENT_DATE
      AND (sp.data_fim IS NULL OR sp.data_fim >= CURRENT_DATE);
