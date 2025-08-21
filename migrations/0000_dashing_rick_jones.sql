CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "instrumentation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"device_name" varchar(255) NOT NULL,
	"device_type" varchar(100) NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"brand_name" varchar(100) NOT NULL,
	"communication_type" varchar(50) NOT NULL,
	"voltage" varchar(50),
	"power_consumption" varchar(50),
	"operating_range" varchar(100),
	"accuracy" varchar(50),
	"installation_date" timestamp,
	"location" varchar(255),
	"installation_notes" text,
	"ip_address" varchar(45),
	"port" integer,
	"slave_id" integer,
	"baud_rate" varchar(20),
	"data_bits" integer,
	"stop_bits" integer,
	"parity" varchar(10),
	"last_calibration" timestamp,
	"next_calibration" timestamp,
	"calibration_interval" integer,
	"maintenance_notes" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"operational_status" varchar(20) DEFAULT 'normal',
	"device_image" varchar(500),
	"manual_path" varchar(500),
	"certificate_path" varchar(500),
	"manufacturer" varchar(100),
	"part_number" varchar(100),
	"firmware_version" varchar(50),
	"comments" text,
	"tags" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ipc_management" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar,
	"device_name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"ams_net_id" varchar(50) NOT NULL,
	"vpn_ip" varchar(45),
	"lan_ip" varchar(45),
	"anydesk" varchar(100),
	"teamviewer" varchar(100),
	"anydesk_password" varchar(255),
	"naming_series" varchar(100),
	"ipc_username" varchar(100),
	"ipc_password" varchar(255),
	"comments" text,
	"manufacture" varchar(100),
	"model" varchar(100),
	"serial_no" varchar(100),
	"mainboard" varchar(100),
	"cpu" varchar(100),
	"flash" varchar(100),
	"power_supply" varchar(100),
	"memory" varchar(100),
	"mac1" varchar(17),
	"mac2" varchar(17),
	"operating_system" varchar(100),
	"image_version" varchar(100),
	"ipc_image" varchar(500),
	"serial_number_of_ipc" varchar(100),
	"device_manager_version" varchar(100),
	"network1_name" varchar(100),
	"network1_virtual_device" varchar(100),
	"network1_gateway" varchar(45),
	"network1_address" varchar(45),
	"network1_dhcp" varchar(20),
	"network1_subnet_mask" varchar(45),
	"network1_dns_servers" varchar(255),
	"network1_mac_address" varchar(17),
	"network2_name" varchar(100),
	"network2_virtual_device" varchar(100),
	"network2_gateway" varchar(45),
	"network2_address" varchar(45),
	"network2_dhcp" varchar(20),
	"network2_subnet_mask" varchar(45),
	"network2_dns_servers" varchar(255),
	"network2_mac_address" varchar(17),
	"events_database_name" varchar(100),
	"events_table_name" varchar(100),
	"last_access" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mbr_realtime_data" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" text NOT NULL,
	"mbr_tmp" numeric(8, 2),
	"mbr_flow" numeric(8, 2),
	"mbr_tank_level" numeric(8, 2),
	"mbr_running_time_hrs" numeric(8, 2),
	"mbr_running_time_min" numeric(8, 2),
	"mbr_running_time_sec" numeric(8, 2),
	"mbr_backwash_without_flow" numeric(8, 2),
	"turbidity" numeric(8, 2),
	"mbr_ph" numeric(8, 2),
	"cts_ph" numeric(8, 2),
	"mbr_pt" numeric(8, 2),
	"backwash_without_count" numeric(8, 2),
	"backwash_with_drain_flow" numeric(8, 2),
	"mbr_permeate" numeric(8, 2),
	"mbr_net_value_day" numeric(8, 2),
	"net_value" numeric(8, 2),
	"h2so4" numeric(8, 2),
	"energy" numeric(8, 2),
	"mbr_ph_temp" numeric(8, 2),
	"h2so4_temp" numeric(8, 2),
	"h2so4_rf" boolean,
	"mbr1pump_rf" boolean,
	"mbr2pump_rf" boolean,
	"mbr_rf" boolean,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plc_io_calculations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"calculation_name" varchar(100) NOT NULL,
	"calculation_description" text,
	"calculation_type" varchar(30) NOT NULL,
	"input_points" jsonb,
	"formula" text,
	"constants" jsonb,
	"output_variable" varchar(100),
	"output_unit" varchar(20),
	"output_data_type" varchar(20) DEFAULT 'REAL',
	"execution_interval" integer DEFAULT 1000,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 5,
	"result_min" numeric(12, 4),
	"result_max" numeric(12, 4),
	"validation_rules" jsonb,
	"example_calculation" text,
	"notes" text,
	"version" varchar(10) DEFAULT '1.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plc_io_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"point_id" varchar,
	"logical_address" varchar(100) NOT NULL,
	"variable_name" varchar(100),
	"symbol_name" varchar(100),
	"device_type" varchar(50),
	"terminal_position" integer,
	"ethercat_address" varchar(20),
	"coupler" varchar(50),
	"is_configured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"last_verification" timestamp,
	"config_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plc_io_points" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"point_name" varchar(100) NOT NULL,
	"point_description" text,
	"point_type" varchar(20) NOT NULL,
	"module_address" varchar(50),
	"channel_number" integer,
	"physical_address" varchar(100),
	"signal_type" varchar(30),
	"engineering_unit" varchar(20),
	"data_type" varchar(20) DEFAULT 'REAL',
	"raw_min" numeric(10, 3),
	"raw_max" numeric(10, 3),
	"engineered_min" numeric(10, 3),
	"engineered_max" numeric(10, 3),
	"is_enabled" boolean DEFAULT true,
	"alarm_high" numeric(10, 3),
	"alarm_low" numeric(10, 3),
	"warning_high" numeric(10, 3),
	"warning_low" numeric(10, 3),
	"comments" text,
	"tags" varchar(300),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plc_tag_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" varchar NOT NULL,
	"old_value" text,
	"new_value" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plc_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"tag_name" varchar(255) NOT NULL,
	"plc_address" varchar(500) NOT NULL,
	"description" text,
	"data_type" varchar(50) DEFAULT 'BOOL' NOT NULL,
	"is_active" boolean DEFAULT true,
	"alarm_on_true" boolean DEFAULT true,
	"alarm_on_false" boolean DEFAULT false,
	"severity_level" varchar(20) DEFAULT 'warning',
	"last_value" text,
	"last_read_time" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_backups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"version" varchar(50),
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"checksum" varchar(64),
	"platform" varchar(50) DEFAULT 'twincat',
	"backup_type" varchar(20) DEFAULT 'manual' NOT NULL,
	"compile_status" varchar(20) DEFAULT 'unknown',
	"compile_errors" text,
	"compile_warnings" text,
	"created_by" varchar(255) NOT NULL,
	"created_by_email" varchar(255),
	"uploaded_by" varchar(255),
	"modified_by" varchar(255),
	"comments" text,
	"tags" varchar(500),
	"is_active" boolean DEFAULT true,
	"backup_source" varchar(100) DEFAULT 'upload',
	"original_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_number" varchar(100) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"location" varchar(255),
	"status" varchar(50) DEFAULT 'Planning' NOT NULL,
	"capacity" varchar(100),
	"ipc_name" varchar(255),
	"selected_ipc_id" varchar,
	"selected_systems" varchar[] DEFAULT ARRAY[]::text[],
	"created_date" timestamp DEFAULT now(),
	"plan_start_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_project_number_unique" UNIQUE("project_number")
);
--> statement-breakpoint
CREATE TABLE "ro_realtime_data" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" text NOT NULL,
	"feed_flow" numeric(8, 2),
	"ro_recovery" numeric(8, 2),
	"ro_feed_ph" numeric(8, 2),
	"ro_feed_lt" numeric(8, 2),
	"stg1_per" numeric(8, 2),
	"stg1_recovery" numeric(8, 2),
	"stg1_in_pt" numeric(8, 2),
	"stg1_out_pt" numeric(8, 2),
	"stg1_dp" numeric(8, 2),
	"stg2_per" numeric(8, 2),
	"stg2_recovery" numeric(8, 2),
	"stg2_in_pt" numeric(8, 2),
	"stg2_out_pt" numeric(8, 2),
	"stg2_dp" numeric(8, 2),
	"ro_cat_in_pt" numeric(8, 2),
	"ro_cat_out_pt" numeric(8, 2),
	"cat_dp" numeric(8, 2),
	"ro_feed_overall" numeric(8, 2),
	"stg_1_overall" numeric(8, 2),
	"stg2_overall" numeric(8, 2),
	"ro_feed_day" numeric(8, 2),
	"stg_1_day" numeric(8, 2),
	"stg_2_day" numeric(8, 2),
	"ro_cip_flow" numeric(8, 2),
	"ro_cip_pt" numeric(8, 2),
	"ro_cip_stg1_dp" numeric(8, 2),
	"ro_cip_stg2_dp" numeric(8, 2),
	"ro_raw_water_flow" numeric(8, 2),
	"hpp1_hz" numeric(8, 2),
	"hpp2_hz" numeric(8, 2),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_database_tags" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" text NOT NULL,
	"tag_name" text NOT NULL,
	"ads_path" text NOT NULL,
	"data_type" text NOT NULL,
	"description" text,
	"unit" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"scan_interval" integer DEFAULT 2000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_database_values" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" text NOT NULL,
	"value" text NOT NULL,
	"quality" text DEFAULT 'GOOD' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"ip_address" varchar(45) NOT NULL,
	"status" varchar(20) DEFAULT 'unknown' NOT NULL,
	"response_time" integer,
	"uptime" numeric(5, 2) DEFAULT '0',
	"last_check" timestamp,
	"last_online" timestamp,
	"site_type" varchar(50) DEFAULT 'production',
	"location" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sites_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE TABLE "uptime_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL,
	"response_time" integer,
	"is_online" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vfd_parameters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"motor_type" varchar(100),
	"frequency" numeric(6, 2),
	"voltage" numeric(6, 2),
	"current" numeric(6, 2),
	"power" numeric(8, 2),
	"rpm" integer,
	"load_percentage" numeric(5, 2),
	"parameters" jsonb,
	"last_update" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrumentation" ADD CONSTRAINT "instrumentation_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ipc_management" ADD CONSTRAINT "ipc_management_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mbr_realtime_data" ADD CONSTRAINT "mbr_realtime_data_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plc_io_calculations" ADD CONSTRAINT "plc_io_calculations_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plc_io_mappings" ADD CONSTRAINT "plc_io_mappings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plc_io_mappings" ADD CONSTRAINT "plc_io_mappings_point_id_plc_io_points_id_fk" FOREIGN KEY ("point_id") REFERENCES "public"."plc_io_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plc_io_points" ADD CONSTRAINT "plc_io_points_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plc_tag_history" ADD CONSTRAINT "plc_tag_history_tag_id_plc_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."plc_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plc_tags" ADD CONSTRAINT "plc_tags_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_backups" ADD CONSTRAINT "program_backups_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_selected_ipc_id_ipc_management_id_fk" FOREIGN KEY ("selected_ipc_id") REFERENCES "public"."ipc_management"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ro_realtime_data" ADD CONSTRAINT "ro_realtime_data_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_database_tags" ADD CONSTRAINT "site_database_tags_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_database_values" ADD CONSTRAINT "site_database_values_tag_id_site_database_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."site_database_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uptime_history" ADD CONSTRAINT "uptime_history_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vfd_parameters" ADD CONSTRAINT "vfd_parameters_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_alerts_site" ON "alerts" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_type" ON "alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_alerts_severity" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_alerts_created" ON "alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_instrumentation_site" ON "instrumentation" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_instrumentation_type" ON "instrumentation" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "idx_instrumentation_status" ON "instrumentation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_instrumentation_communication" ON "instrumentation" USING btree ("communication_type");--> statement-breakpoint
CREATE INDEX "idx_ipc_site" ON "ipc_management" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_ipc_ams_net_id" ON "ipc_management" USING btree ("ams_net_id");--> statement-breakpoint
CREATE INDEX "idx_ipc_status" ON "ipc_management" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ipc_device_name" ON "ipc_management" USING btree ("device_name");--> statement-breakpoint
CREATE INDEX "idx_mbr_site_timestamp" ON "mbr_realtime_data" USING btree ("site_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_plc_calculations_site" ON "plc_io_calculations" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_plc_calculations_type" ON "plc_io_calculations" USING btree ("calculation_type");--> statement-breakpoint
CREATE INDEX "idx_plc_calculations_active" ON "plc_io_calculations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_plc_mappings_site" ON "plc_io_mappings" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_plc_mappings_point" ON "plc_io_mappings" USING btree ("point_id");--> statement-breakpoint
CREATE INDEX "idx_plc_mappings_logical" ON "plc_io_mappings" USING btree ("logical_address");--> statement-breakpoint
CREATE INDEX "idx_plc_mappings_ethercat" ON "plc_io_mappings" USING btree ("ethercat_address");--> statement-breakpoint
CREATE INDEX "idx_plc_io_points_site" ON "plc_io_points" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_plc_io_points_type" ON "plc_io_points" USING btree ("point_type");--> statement-breakpoint
CREATE INDEX "idx_plc_io_points_module" ON "plc_io_points" USING btree ("module_address");--> statement-breakpoint
CREATE INDEX "idx_plc_tag_history_tag" ON "plc_tag_history" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_plc_tag_history_timestamp" ON "plc_tag_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_plc_tags_site" ON "plc_tags" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_plc_tags_active" ON "plc_tags" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_plc_tags_name" ON "plc_tags" USING btree ("tag_name");--> statement-breakpoint
CREATE INDEX "idx_backups_site" ON "program_backups" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_backups_type" ON "program_backups" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_backups_created_by" ON "program_backups" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_backups_active" ON "program_backups" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_backups_compile_status" ON "program_backups" USING btree ("compile_status");--> statement-breakpoint
CREATE INDEX "idx_projects_number" ON "projects" USING btree ("project_number");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ro_site_timestamp" ON "ro_realtime_data" USING btree ("site_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_sites_status" ON "sites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sites_ip" ON "sites" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_uptime_site_timestamp" ON "uptime_history" USING btree ("site_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_vfd_site" ON "vfd_parameters" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_vfd_active" ON "vfd_parameters" USING btree ("is_active");