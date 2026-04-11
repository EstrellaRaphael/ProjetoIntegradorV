-- ============================================================
--  MS-3 · Turmas e Disciplinas · Sistema de Gestão Escolar v3.0
--  Banco: MariaDB (HeidiSQL)
-- ============================================================

CREATE TABLE disciplina (
    id           CHAR(36)     NOT NULL,
    nome         VARCHAR(150) NOT NULL,
    carga_horaria SMALLINT    NOT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_carga_horaria CHECK (carga_horaria > 0)
);

CREATE TABLE calendario_escolar (
    id        CHAR(36)     NOT NULL,
    data      DATE         NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo      ENUM('AULA','FERIADO','RECESSO','EVENTO') NOT NULL DEFAULT 'AULA',
    PRIMARY KEY (id),
    UNIQUE KEY uq_calendario_data_tipo (data, tipo)
);

CREATE TABLE turma (
    id           CHAR(36)    NOT NULL,
    codigo       VARCHAR(50) NOT NULL,
    ano_letivo   YEAR        NOT NULL,
    turno        ENUM('MANHA','TARDE','NOITE') NOT NULL,
    calendario_id CHAR(36)  NOT NULL,
    created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_turma_calendario FOREIGN KEY (calendario_id)
        REFERENCES calendario_escolar (id) ON DELETE RESTRICT,
    UNIQUE KEY uq_turma_codigo_ano (codigo, ano_letivo)
);

CREATE TABLE alocacao_professor (
    id             CHAR(36) NOT NULL,
    professor_id   CHAR(36) NOT NULL,
    disciplina_id  CHAR(36) NOT NULL,
    turma_id       CHAR(36) NOT NULL,
    data_vinculacao DATE    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_aloc_prof_disciplina FOREIGN KEY (disciplina_id)
        REFERENCES disciplina (id) ON DELETE RESTRICT,
    CONSTRAINT fk_aloc_prof_turma FOREIGN KEY (turma_id)
        REFERENCES turma (id) ON DELETE RESTRICT,
    UNIQUE KEY uq_alocacao_professor (professor_id, disciplina_id, turma_id)
);

CREATE TABLE alocacao_aluno (
    id             CHAR(36) NOT NULL,
    aluno_id       CHAR(36) NOT NULL,
    turma_id       CHAR(36) NOT NULL,
    data_matricula DATE     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_aloc_aluno_turma FOREIGN KEY (turma_id)
        REFERENCES turma (id) ON DELETE RESTRICT,
    UNIQUE KEY uq_alocacao_aluno (aluno_id, turma_id)
);

CREATE INDEX idx_disc_nome          ON disciplina (nome);

CREATE INDEX idx_cal_data           ON calendario_escolar (data);
CREATE INDEX idx_cal_tipo           ON calendario_escolar (tipo);

CREATE INDEX idx_turma_ano          ON turma (ano_letivo);
CREATE INDEX idx_turma_calendario   ON turma (calendario_id);

CREATE INDEX idx_aloc_prof_turma    ON alocacao_professor (turma_id);
CREATE INDEX idx_aloc_prof_disc     ON alocacao_professor (disciplina_id);
CREATE INDEX idx_aloc_prof_id       ON alocacao_professor (professor_id);

CREATE INDEX idx_aloc_aluno_turma   ON alocacao_aluno (turma_id);
CREATE INDEX idx_aloc_aluno_id      ON alocacao_aluno (aluno_id);

CREATE VIEW vw_turma_completa AS
SELECT
    t.id AS turma_id,
    t.codigo,
    t.ano_letivo,
    t.turno,
    ap.professor_id,
    ap.disciplina_id,
    d.nome AS disciplina_nome,
    d.carga_horaria
FROM turma t
LEFT JOIN alocacao_professor ap ON ap.turma_id = t.id
LEFT JOIN disciplina d          ON d.id = ap.disciplina_id;
