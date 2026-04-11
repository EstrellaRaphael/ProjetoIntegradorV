-- ============================================================
--  MS-4 · Avaliações e Notas · Sistema de Gestão Escolar v3.0
--  Banco: MariaDB (HeidiSQL)
--  Autor: Carlos Eduardo Gonçalves
-- ============================================================

CREATE TABLE configuracao_avaliacao (
    id                    CHAR(36)     NOT NULL,
    media_min_aprovacao   DECIMAL(4,2) NOT NULL DEFAULT 6.00,
    vigente_desde         TIMESTAMP    NOT NULL,
    alterado_por_admin_id CHAR(36)     NOT NULL,
    ativa                 BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT chk_media_min CHECK (media_min_aprovacao BETWEEN 0.00 AND 10.00)
);

CREATE TABLE avaliacao (
    id             CHAR(36)     NOT NULL,
    titulo         VARCHAR(120) NOT NULL,
    tipo           ENUM('PROVA','TRABALHO','RECUPERACAO','PROVA_FINAL') NOT NULL,
    bimestre       SMALLINT     NOT NULL,
    ano_letivo     YEAR         NOT NULL,
    disciplina_id  CHAR(36)     NOT NULL,
    turma_id       CHAR(36)     NOT NULL,
    professor_id   CHAR(36)     NOT NULL,
    data_aplicacao DATE         NOT NULL,
    peso_na_media  DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    criada_em      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_bimestre CHECK (bimestre BETWEEN 1 AND 4),
    CONSTRAINT chk_peso     CHECK (peso_na_media > 0)
);

CREATE TABLE nota (
    id           CHAR(36)     NOT NULL,
    avaliacao_id CHAR(36)     NOT NULL,
    aluno_id     CHAR(36)     NOT NULL,
    professor_id CHAR(36)     NOT NULL,
    valor        DECIMAL(4,2) NOT NULL,
    substituida  BOOLEAN      NOT NULL DEFAULT FALSE,
    lancada_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    editada_em   TIMESTAMP    NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_nota_avaliacao FOREIGN KEY (avaliacao_id)
        REFERENCES avaliacao (id) ON DELETE RESTRICT,
    CONSTRAINT chk_valor_nota CHECK (valor BETWEEN 0.00 AND 10.00),
    UNIQUE KEY uq_nota_aluno_avaliacao (avaliacao_id, aluno_id)
);

CREATE TABLE media_bimestral (
    id                   CHAR(36)     NOT NULL,
    aluno_id             CHAR(36)     NOT NULL,
    disciplina_id        CHAR(36)     NOT NULL,
    bimestre             SMALLINT     NOT NULL,
    ano_letivo           YEAR         NOT NULL,
    valor_calculado      DECIMAL(4,2) NOT NULL,
    recuperacao_aplicada BOOLEAN      NOT NULL DEFAULT FALSE,
    calculada_em         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_bimestre_mb CHECK (bimestre BETWEEN 1 AND 4),
    CONSTRAINT chk_valor_mb    CHECK (valor_calculado BETWEEN 0.00 AND 10.00),
    UNIQUE KEY uq_media_aluno_bim (aluno_id, disciplina_id, bimestre, ano_letivo)
);

CREATE TABLE prova_final (
    id               CHAR(36)     NOT NULL,
    aluno_id         CHAR(36)     NOT NULL,
    disciplina_id    CHAR(36)     NOT NULL,
    ano_letivo       YEAR         NOT NULL,
    nota_prova_final DECIMAL(4,2) NULL DEFAULT NULL,
    media_anual      DECIMAL(4,2) NOT NULL,
    media_final      DECIMAL(4,2) NULL DEFAULT NULL,
    status           ENUM('EM_CURSO','APROVADO','APROVADO_PF','REPROVADO_NOTA','REPROVADO_FALTA') NOT NULL DEFAULT 'EM_CURSO',
    lancada_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_nota_pf     CHECK (nota_prova_final IS NULL OR nota_prova_final BETWEEN 0.00 AND 10.00),
    CONSTRAINT chk_media_anual CHECK (media_anual BETWEEN 0.00 AND 10.00),
    CONSTRAINT chk_media_final CHECK (media_final IS NULL OR media_final BETWEEN 0.00 AND 10.00),
    UNIQUE KEY uq_pf_aluno_disc (aluno_id, disciplina_id, ano_letivo)
);

CREATE INDEX idx_aval_turma      ON avaliacao (turma_id);
CREATE INDEX idx_aval_disciplina ON avaliacao (disciplina_id);
CREATE INDEX idx_aval_professor  ON avaliacao (professor_id);
CREATE INDEX idx_aval_bim_ano    ON avaliacao (bimestre, ano_letivo);

CREATE INDEX idx_nota_aluno      ON nota (aluno_id);

CREATE INDEX idx_mb_aluno_ano    ON media_bimestral (aluno_id, ano_letivo);
CREATE INDEX idx_mb_disciplina   ON media_bimestral (disciplina_id);

CREATE INDEX idx_pf_aluno_ano    ON prova_final (aluno_id, ano_letivo);
CREATE INDEX idx_pf_disciplina   ON prova_final (disciplina_id);

CREATE INDEX idx_config_ativa    ON configuracao_avaliacao (ativa);

CREATE VIEW vw_boletim_aluno AS
SELECT
    mb.aluno_id,
    mb.disciplina_id,
    mb.ano_letivo,
    mb.bimestre,
    mb.valor_calculado AS media_bimestral,
    mb.recuperacao_aplicada,
    pf.nota_prova_final,
    pf.media_anual,
    pf.media_final,
    pf.status
FROM media_bimestral mb
LEFT JOIN prova_final pf
    ON  pf.aluno_id      = mb.aluno_id
    AND pf.disciplina_id = mb.disciplina_id
    AND pf.ano_letivo    = mb.ano_letivo;
