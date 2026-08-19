/* ============================================================
   ORDER TRACKING DATABASE
   Azure SQL / SQL Server
   ============================================================ */


/* ============================================================
   1. CRDs
   ============================================================ */

CREATE TABLE crds (
    crd_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    crd_name        NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_crds_crd_name
        UNIQUE (crd_name)
);


/* ============================================================
   2. CRD VERSIONS
   ============================================================ */

CREATE TABLE crd_versions (
    crd_version_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    crd_id          BIGINT NOT NULL,
    version         NVARCHAR(50) NOT NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_crd_versions_crd
        FOREIGN KEY (crd_id)
        REFERENCES crds(crd_id),

    CONSTRAINT UQ_crd_versions
        UNIQUE (crd_id, version)
);


/* ============================================================
   3. PROCESSES
   Master list of all possible processes
   ============================================================ */

CREATE TABLE processes (
    process_id      INT IDENTITY(1,1) PRIMARY KEY,
    process_name    NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500) NULL,

    is_active       BIT NOT NULL DEFAULT 1,

    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_processes_name
        UNIQUE (process_name)
);


/* ============================================================
   4. CRD VERSION <-> PROCESSES
   Defines the workflow for each CRD version
   ============================================================ */

CREATE TABLE crd_version_processes (
    crd_version_id  BIGINT NOT NULL,
    process_id      INT NOT NULL,

    sequence        INT NOT NULL,
    is_required     BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_crd_version_processes
        PRIMARY KEY (crd_version_id, process_id),

    CONSTRAINT FK_crd_version_processes_crd
        FOREIGN KEY (crd_version_id)
        REFERENCES crd_versions(crd_version_id),

    CONSTRAINT FK_crd_version_processes_process
        FOREIGN KEY (process_id)
        REFERENCES processes(process_id),

    CONSTRAINT UQ_crd_version_process_sequence
        UNIQUE (crd_version_id, sequence),

    CONSTRAINT CK_crd_version_process_sequence
        CHECK (sequence > 0)
);


/* ============================================================
   5. ORDERS
   ============================================================ */

CREATE TABLE orders (
    order_id           BIGINT IDENTITY(1,1) PRIMARY KEY,

    stage              NVARCHAR(50) NOT NULL,
    crd_version_id     BIGINT NULL,

    start_date         DATETIME2 NULL,
    end_date           DATETIME2 NULL,

    progress           DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    created_at         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_orders_crd_version
        FOREIGN KEY (crd_version_id)
        REFERENCES crd_versions(crd_version_id),

    CONSTRAINT CK_orders_progress
        CHECK (progress >= 0 AND progress <= 100),

    CONSTRAINT CK_orders_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
);


/* ============================================================
   6. RACKS
   ============================================================ */

CREATE TABLE racks (
    rack_id            BIGINT IDENTITY(1,1) PRIMARY KEY,

    rack_sku           NVARCHAR(100) NOT NULL,
    rack_gen_name      NVARCHAR(100) NULL,
    rack_serial        NVARCHAR(100) NOT NULL,

    current_process_id INT NULL,

    created_at         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_racks_serial
        UNIQUE (rack_serial),

    CONSTRAINT FK_racks_current_process
        FOREIGN KEY (current_process_id)
        REFERENCES processes(process_id)
);


/* ============================================================
   7. ORDER <-> RACK
   ============================================================ */

CREATE TABLE order_racks (
    order_id       BIGINT NOT NULL,
    rack_id        BIGINT NOT NULL,
    rack_sequence  INT NULL,

    CONSTRAINT PK_order_racks
        PRIMARY KEY (order_id, rack_id),

    CONSTRAINT FK_order_racks_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT FK_order_racks_rack
        FOREIGN KEY (rack_id)
        REFERENCES racks(rack_id)
);


/* ============================================================
   8. RACK POSITIONS
   ============================================================ */

CREATE TABLE rack_positions (
    rack_position_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    rack_id          BIGINT NOT NULL,
    position         INT NOT NULL,

    CONSTRAINT FK_rack_positions_rack
        FOREIGN KEY (rack_id)
        REFERENCES racks(rack_id),

    CONSTRAINT UQ_rack_positions
        UNIQUE (rack_id, position),

    CONSTRAINT CK_rack_position_number
        CHECK (position >= 1 AND position <= 48)
);


/* ============================================================
   9. DEVICE TYPES
   ============================================================ */

CREATE TABLE device_types (
    device_type_id INT IDENTITY(1,1) PRIMARY KEY,

    name           NVARCHAR(50) NOT NULL,

    CONSTRAINT UQ_device_types_name
        UNIQUE (name)
);


/* ============================================================
   10. DEVICES
   ============================================================ */

CREATE TABLE devices (
    device_id         BIGINT IDENTITY(1,1) PRIMARY KEY,

    rack_position_id  BIGINT NOT NULL,
    device_type_id    INT NOT NULL,

    sku               NVARCHAR(100) NULL,
    sku_generic_name  NVARCHAR(100) NULL,
    serial_number     NVARCHAR(100) NULL,

    current_process_id INT NULL,

    created_at        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_devices_rack_position
        FOREIGN KEY (rack_position_id)
        REFERENCES rack_positions(rack_position_id),

    CONSTRAINT FK_devices_device_type
        FOREIGN KEY (device_type_id)
        REFERENCES device_types(device_type_id),

    CONSTRAINT FK_devices_current_process
        FOREIGN KEY (current_process_id)
        REFERENCES processes(process_id)
);


/* ============================================================
   11. COMPONENT TYPES
   ============================================================ */

CREATE TABLE component_types (
    component_type_id INT IDENTITY(1,1) PRIMARY KEY,

    name              NVARCHAR(50) NOT NULL,

    CONSTRAINT UQ_component_types_name
        UNIQUE (name)
);


/* ============================================================
   12. DEVICE COMPONENTS
   ============================================================ */

CREATE TABLE device_components (
    component_id       BIGINT IDENTITY(1,1) PRIMARY KEY,

    device_id          BIGINT NOT NULL,
    component_type_id  INT NOT NULL,

    serial_number      NVARCHAR(100) NULL,

    created_at         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_device_components_device
        FOREIGN KEY (device_id)
        REFERENCES devices(device_id),

    CONSTRAINT FK_device_components_type
        FOREIGN KEY (component_type_id)
        REFERENCES component_types(component_type_id)
);


/* ============================================================
   13. USERS
   ============================================================ */

CREATE TABLE users (
    user_id        BIGINT IDENTITY(1,1) PRIMARY KEY,

    username       NVARCHAR(100) NOT NULL,
    display_name   NVARCHAR(200) NULL,
    email          NVARCHAR(255) NULL,

    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_users_username
        UNIQUE (username)
);


/* ============================================================
   14. ROLES
   ============================================================ */

CREATE TABLE roles (
    role_id        INT IDENTITY(1,1) PRIMARY KEY,

    role_name      NVARCHAR(50) NOT NULL,

    CONSTRAINT UQ_roles_name
        UNIQUE (role_name)
);


/* ============================================================
   15. ORDER <-> USERS
   ============================================================ */

CREATE TABLE order_users (
    order_id    BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    role_id     INT NOT NULL,

    CONSTRAINT PK_order_users
        PRIMARY KEY (order_id, user_id),

    CONSTRAINT FK_order_users_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT FK_order_users_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT FK_order_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);


/* ============================================================
   16. DEVICE PROCESS HISTORY
   ============================================================ */

CREATE TABLE device_process_history (
    device_process_history_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    device_id       BIGINT NOT NULL,
    process_id      INT NOT NULL,

    started_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ended_at        DATETIME2 NULL,

    reported_by     NVARCHAR(100) NULL,

    CONSTRAINT FK_device_process_history_device
        FOREIGN KEY (device_id)
        REFERENCES devices(device_id),

    CONSTRAINT FK_device_process_history_process
        FOREIGN KEY (process_id)
        REFERENCES processes(process_id),

    CONSTRAINT CK_device_process_history_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        )
);


/* ============================================================
   17. RACK PROCESS HISTORY
   ============================================================ */

CREATE TABLE rack_process_history (
    rack_process_history_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    rack_id         BIGINT NOT NULL,
    process_id      INT NOT NULL,

    started_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ended_at        DATETIME2 NULL,

    reported_by     NVARCHAR(100) NULL,

    CONSTRAINT FK_rack_process_history_rack
        FOREIGN KEY (rack_id)
        REFERENCES racks(rack_id),

    CONSTRAINT FK_rack_process_history_process
        FOREIGN KEY (process_id)
        REFERENCES processes(process_id),

    CONSTRAINT CK_rack_process_history_dates
        CHECK (
            ended_at IS NULL
            OR ended_at >= started_at
        )
);


/* ============================================================
   18. INDEXES
   ============================================================ */


/* CRD versions */
CREATE INDEX IX_crd_versions_crd
    ON crd_versions(crd_id);


/* CRD workflow */
CREATE INDEX IX_crd_version_processes_process
    ON crd_version_processes(process_id);


/* Orders */
CREATE INDEX IX_orders_crd_version
    ON orders(crd_version_id);


/* Orders -> racks */
CREATE INDEX IX_order_racks_rack
    ON order_racks(rack_id);


/* Racks -> current process */
CREATE INDEX IX_racks_current_process
    ON racks(current_process_id);


/* Rack positions */
CREATE INDEX IX_rack_positions_rack
    ON rack_positions(rack_id);


/* Devices -> rack position */
CREATE INDEX IX_devices_rack_position
    ON devices(rack_position_id);


/* Devices -> type */
CREATE INDEX IX_devices_device_type
    ON devices(device_type_id);


/* Devices -> current process */
CREATE INDEX IX_devices_current_process
    ON devices(current_process_id);


/* Device components -> device */
CREATE INDEX IX_device_components_device
    ON device_components(device_id);


/* Device components -> type */
CREATE INDEX IX_device_components_type
    ON device_components(component_type_id);


/* Order users -> user */
CREATE INDEX IX_order_users_user
    ON order_users(user_id);


/* Order users -> role */
CREATE INDEX IX_order_users_role
    ON order_users(role_id);


/* Device process history */
CREATE INDEX IX_device_process_history_device
    ON device_process_history(device_id);


/* Device process history -> process */
CREATE INDEX IX_device_process_history_process
    ON device_process_history(process_id);


/* Rack process history */
CREATE INDEX IX_rack_process_history_rack
    ON rack_process_history(rack_id);


/* Rack process history -> process */
CREATE INDEX IX_rack_process_history_process
    ON rack_process_history(process_id);


/* Lookup data for Schema */
/* Device types */

INSERT INTO device_types (name)
VALUES
    ('BLADE'),
    ('MGMSWITCH'),
    ('TORSWITCH'),
    ('BLANK')
    ('PDU');


/* Component types */

INSERT INTO component_types (name)
VALUES
    ('CPU_SOC'),
    ('NIC_FPGA'),
    ('DCSCM'),
    ('FABRIC'),
    ('MAINBOARD');


/* Roles */

INSERT INTO roles (role_name)
VALUES
    ('HMPM'),
    ('MTE'),
    ('QE'),
    ('MFE'),
    ('SIHMPM'),
    ('SITE');