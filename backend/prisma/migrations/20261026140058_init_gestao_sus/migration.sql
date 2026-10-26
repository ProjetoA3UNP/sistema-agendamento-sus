-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `cartaoSus` VARCHAR(18) NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `perfil` ENUM('CIDADAO', 'ATENDENTE', 'MEDICO', 'GESTOR') NOT NULL DEFAULT 'CIDADAO',
    `telefone` VARCHAR(20) NULL,
    `bairro` VARCHAR(100) NULL,
    `dataNascimento` DATE NULL,
    `aceitouTermosLgpd` BOOLEAN NOT NULL DEFAULT false,
    `termosLgpdEm` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_cpf_key`(`cpf`),
    UNIQUE INDEX `usuarios_cartaoSus_key`(`cartaoSus`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ubss` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `cnes` VARCHAR(20) NULL,
    `logradouro` VARCHAR(200) NOT NULL,
    `numero` VARCHAR(20) NULL,
    `bairro` VARCHAR(100) NOT NULL,
    `distritoSanitario` ENUM('NORTE', 'SUL', 'LESTE', 'OESTE') NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `horarioAbertura` VARCHAR(5) NOT NULL DEFAULT '07:00',
    `horarioFechamento` VARCHAR(5) NOT NULL DEFAULT '17:00',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ubss_cnes_key`(`cnes`),
    INDEX `ubss_distritoSanitario_bairro_idx`(`distritoSanitario`, `bairro`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especialidades` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `especialidades_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ubs_especialidades` (
    `ubsId` VARCHAR(191) NOT NULL,
    `especialidadeId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`ubsId`, `especialidadeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vagas` (
    `id` VARCHAR(191) NOT NULL,
    `ubsId` VARCHAR(191) NOT NULL,
    `especialidadeId` VARCHAR(191) NOT NULL,
    `medicoId` VARCHAR(191) NULL,
    `data` DATE NOT NULL,
    `turno` ENUM('MANHA', 'TARDE') NOT NULL,
    `horarioInicio` VARCHAR(5) NOT NULL,
    `horarioFim` VARCHAR(5) NOT NULL,
    `status` ENUM('DISPONIVEL', 'RESERVADA', 'BLOQUEADA') NOT NULL DEFAULT 'DISPONIVEL',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `idx_busca_vagas`(`ubsId`, `data`, `especialidadeId`, `status`),
    INDEX `idx_status_data`(`status`, `data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agendamentos` (
    `id` VARCHAR(191) NOT NULL,
    `codigoProtocolo` VARCHAR(30) NOT NULL,
    `qrCodeToken` VARCHAR(64) NOT NULL,
    `vagaId` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `status` ENUM('AGENDADO', 'CHECK_IN', 'EM_ATENDIMENTO', 'FINALIZADO', 'CANCELADO', 'FALTA') NOT NULL DEFAULT 'AGENDADO',
    `motivoCancelamento` VARCHAR(255) NULL,
    `canceladoEm` DATETIME(3) NULL,
    `checkInEm` DATETIME(3) NULL,
    `finalizadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agendamentos_codigoProtocolo_key`(`codigoProtocolo`),
    UNIQUE INDEX `agendamentos_qrCodeToken_key`(`qrCodeToken`),
    UNIQUE INDEX `agendamentos_vagaId_key`(`vagaId`),
    INDEX `idx_paciente_agendamentos`(`pacienteId`, `status`),
    INDEX `idx_codigo_protocolo`(`codigoProtocolo`),
    INDEX `idx_qrcode_token`(`qrCodeToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs_auditoria` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,
    `acao` VARCHAR(60) NOT NULL,
    `entidade` VARCHAR(60) NOT NULL,
    `entidadeId` VARCHAR(64) NULL,
    `detalhesJson` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_usuario_auditoria`(`usuarioId`, `criadoEm`),
    INDEX `idx_entidade_auditoria`(`entidade`, `entidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ubs_especialidades` ADD CONSTRAINT `ubs_especialidades_ubsId_fkey` FOREIGN KEY (`ubsId`) REFERENCES `ubss`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ubs_especialidades` ADD CONSTRAINT `ubs_especialidades_especialidadeId_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vagas` ADD CONSTRAINT `vagas_ubsId_fkey` FOREIGN KEY (`ubsId`) REFERENCES `ubss`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vagas` ADD CONSTRAINT `vagas_especialidadeId_fkey` FOREIGN KEY (`especialidadeId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vagas` ADD CONSTRAINT `vagas_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_vagaId_fkey` FOREIGN KEY (`vagaId`) REFERENCES `vagas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs_auditoria` ADD CONSTRAINT `logs_auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
