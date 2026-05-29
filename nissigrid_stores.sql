--
-- PostgreSQL database dump
--

\restrict S10HbPBVFepS0Rx6TtRDOWfkfgZJ6OW04WOeSoiIZb2ojQ58EEUra6tvFmKzFvt

-- Dumped from database version 17.10 (Ubuntu 17.10-1.pgdg22.04+1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20),
    title character varying(255) NOT NULL,
    message text,
    reference_type character varying(50),
    reference_id integer,
    project_id integer,
    is_read boolean,
    is_resolved boolean,
    created_at timestamp without time zone,
    resolved_at timestamp without time zone
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: approval_flows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_flows (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    document_type character varying(50) NOT NULL,
    level integer NOT NULL,
    role_name character varying(100) NOT NULL,
    min_amount double precision,
    max_amount double precision,
    user_id integer,
    is_active boolean
);


ALTER TABLE public.approval_flows OWNER TO postgres;

--
-- Name: approval_flows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_flows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_flows_id_seq OWNER TO postgres;

--
-- Name: approval_flows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_flows_id_seq OWNED BY public.approval_flows.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    tenant_id integer,
    site_id integer,
    user_id integer,
    action character varying(50) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer,
    old_values text,
    new_values text,
    ip_address character varying(50),
    created_at timestamp without time zone
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: buildings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buildings (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    project_id integer NOT NULL,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.buildings OWNER TO postgres;

--
-- Name: buildings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buildings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buildings_id_seq OWNER TO postgres;

--
-- Name: buildings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buildings_id_seq OWNED BY public.buildings.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(100) NOT NULL,
    sequence_number integer,
    code character varying(50),
    description text,
    is_active boolean,
    is_deleted boolean
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: current_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.current_stock (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    material_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity double precision,
    last_updated timestamp without time zone
);


ALTER TABLE public.current_stock OWNER TO postgres;

--
-- Name: current_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.current_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.current_stock_id_seq OWNER TO postgres;

--
-- Name: current_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.current_stock_id_seq OWNED BY public.current_stock.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    accounting_code character varying(100),
    building_id integer NOT NULL,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: document_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_sequences (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    document_type character varying(50) NOT NULL,
    prefix character varying(20) NOT NULL,
    current_number integer NOT NULL
);


ALTER TABLE public.document_sequences OWNER TO postgres;

--
-- Name: document_sequences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_sequences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_sequences_id_seq OWNER TO postgres;

--
-- Name: document_sequences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_sequences_id_seq OWNED BY public.document_sequences.id;


--
-- Name: floors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.floors (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    level integer,
    building_id integer NOT NULL,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.floors OWNER TO postgres;

--
-- Name: floors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.floors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.floors_id_seq OWNER TO postgres;

--
-- Name: floors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.floors_id_seq OWNED BY public.floors.id;


--
-- Name: gate_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gate_entries (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    entry_number character varying(50) NOT NULL,
    vehicle_number character varying(50),
    vendor_id integer,
    po_id integer,
    project_id integer,
    material_id integer,
    quantity double precision,
    arrival_time timestamp without time zone,
    driver_name character varying(255),
    driver_phone character varying(20),
    delivery_person_name character varying(255),
    entry_type character varying(50),
    photo_url character varying(500),
    invoice_scan_url character varying(500),
    remarks text,
    status character varying(50),
    recorded_by_id integer NOT NULL,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.gate_entries OWNER TO postgres;

--
-- Name: gate_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gate_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gate_entries_id_seq OWNER TO postgres;

--
-- Name: gate_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gate_entries_id_seq OWNED BY public.gate_entries.id;


--
-- Name: gate_passes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gate_passes (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    gate_pass_number character varying(50) NOT NULL,
    return_id integer,
    project_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL,
    vendor_id integer,
    status character varying(50),
    gate_pass_type character varying(50),
    driver_name character varying(255),
    vehicle_number character varying(50),
    remarks text,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.gate_passes OWNER TO postgres;

--
-- Name: gate_passes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gate_passes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gate_passes_id_seq OWNER TO postgres;

--
-- Name: gate_passes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gate_passes_id_seq OWNED BY public.gate_passes.id;


--
-- Name: grn; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grn (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    grn_number character varying(50) NOT NULL,
    po_id integer,
    gate_entry_id integer,
    warehouse_id integer NOT NULL,
    project_id integer NOT NULL,
    vendor_id integer NOT NULL,
    receipt_type character varying(50),
    invoice_number character varying(100),
    invoice_date date,
    invoice_amount double precision,
    invoice_scan_url character varying(500),
    vendor_gstin character varying(20),
    total_taxable_amount double precision,
    total_cgst double precision,
    total_sgst double precision,
    total_igst double precision,
    total_tax double precision,
    eway_bill_number character varying(50),
    payment_status character varying(50),
    status character varying(50),
    remarks text,
    received_by_id integer NOT NULL,
    is_deleted boolean,
    created_at timestamp without time zone,
    completed_at timestamp without time zone,
    invoice_id integer
);


ALTER TABLE public.grn OWNER TO postgres;

--
-- Name: grn_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grn_id_seq OWNER TO postgres;

--
-- Name: grn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grn_id_seq OWNED BY public.grn.id;


--
-- Name: grn_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grn_items (
    id integer NOT NULL,
    grn_id integer NOT NULL,
    material_id integer NOT NULL,
    po_item_id integer,
    ordered_quantity double precision,
    received_quantity double precision NOT NULL,
    accepted_quantity double precision NOT NULL,
    rejected_quantity double precision,
    rate double precision,
    hsn_code character varying(20),
    cgst_rate double precision,
    sgst_rate double precision,
    igst_rate double precision,
    cgst_amount double precision,
    sgst_amount double precision,
    igst_amount double precision,
    taxable_amount double precision,
    discount_percent double precision,
    remarks text
);


ALTER TABLE public.grn_items OWNER TO postgres;

--
-- Name: grn_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grn_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grn_items_id_seq OWNER TO postgres;

--
-- Name: grn_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grn_items_id_seq OWNED BY public.grn_items.id;


--
-- Name: indent_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indent_approvals (
    id integer NOT NULL,
    indent_id integer NOT NULL,
    approval_flow_id integer NOT NULL,
    approver_id integer NOT NULL,
    approved_at timestamp without time zone
);


ALTER TABLE public.indent_approvals OWNER TO postgres;

--
-- Name: indent_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.indent_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.indent_approvals_id_seq OWNER TO postgres;

--
-- Name: indent_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.indent_approvals_id_seq OWNED BY public.indent_approvals.id;


--
-- Name: indent_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indent_items (
    id integer NOT NULL,
    indent_id integer NOT NULL,
    material_id integer NOT NULL,
    requested_quantity double precision NOT NULL,
    issued_quantity double precision,
    acknowledged_quantity double precision
);


ALTER TABLE public.indent_items OWNER TO postgres;

--
-- Name: indent_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.indent_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.indent_items_id_seq OWNER TO postgres;

--
-- Name: indent_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.indent_items_id_seq OWNED BY public.indent_items.id;


--
-- Name: indents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.indents (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    indent_number character varying(50) NOT NULL,
    requester_id integer NOT NULL,
    room_id integer,
    building_id integer,
    floor character varying(50),
    location character varying(255),
    department character varying(255),
    remarks text,
    total_amount double precision,
    status character varying(50),
    current_approval_level integer,
    approved_by_id integer,
    approved_at timestamp without time zone,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.indents OWNER TO postgres;

--
-- Name: indents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.indents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.indents_id_seq OWNER TO postgres;

--
-- Name: indents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.indents_id_seq OWNED BY public.indents.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    material_id integer,
    description character varying(255),
    hsn_sac character varying(50),
    quantity double precision NOT NULL,
    rate double precision NOT NULL,
    uom character varying(50),
    discount_percent double precision,
    cgst_rate double precision,
    sgst_rate double precision,
    igst_rate double precision,
    cgst_amount double precision,
    sgst_amount double precision,
    igst_amount double precision,
    taxable_amount double precision,
    amount double precision NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    invoice_date date NOT NULL,
    gate_entry_id integer,
    vendor_id integer NOT NULL,
    po_id integer,
    total_amount double precision,
    tax_amount double precision,
    status character varying(50),
    scan_url character varying(500),
    remarks text,
    created_by_id integer NOT NULL,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    eway_bill_number character varying(100),
    delivery_note character varying(100),
    delivery_note_date date,
    payment_terms character varying(255),
    reference_number character varying(100),
    reference_date date,
    dispatch_doc_number character varying(100),
    dispatched_through character varying(100),
    destination character varying(255),
    lr_rr_number character varying(100),
    vehicle_number character varying(50),
    terms_of_delivery text,
    total_taxable_amount double precision,
    total_cgst double precision,
    total_sgst double precision,
    total_igst double precision,
    total_discount double precision
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: material_issue_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_issue_items (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL,
    rate double precision,
    remarks text
);


ALTER TABLE public.material_issue_items OWNER TO postgres;

--
-- Name: material_issue_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_issue_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_issue_items_id_seq OWNER TO postgres;

--
-- Name: material_issue_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_issue_items_id_seq OWNED BY public.material_issue_items.id;


--
-- Name: material_issues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_issues (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    issue_number character varying(50) NOT NULL,
    warehouse_id integer NOT NULL,
    project_id integer NOT NULL,
    indent_id integer,
    building_id integer,
    issued_to_room_id integer,
    issued_to_department character varying(255),
    issued_to_contractor character varying(255),
    purpose text,
    status character varying(50),
    issued_by_id integer NOT NULL,
    received_by_name character varying(255),
    is_acknowledged boolean,
    acknowledged_at timestamp without time zone,
    acknowledged_by_id integer,
    acknowledgement_remarks text,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.material_issues OWNER TO postgres;

--
-- Name: material_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_issues_id_seq OWNER TO postgres;

--
-- Name: material_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_issues_id_seq OWNED BY public.material_issues.id;


--
-- Name: material_return_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_return_items (
    id integer NOT NULL,
    return_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL,
    condition character varying(50),
    remarks text
);


ALTER TABLE public.material_return_items OWNER TO postgres;

--
-- Name: material_return_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_return_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_return_items_id_seq OWNER TO postgres;

--
-- Name: material_return_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_return_items_id_seq OWNED BY public.material_return_items.id;


--
-- Name: material_returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_returns (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    return_number character varying(50) NOT NULL,
    warehouse_id integer NOT NULL,
    project_id integer NOT NULL,
    returned_from_room_id integer,
    returned_from_department character varying(255),
    return_type character varying(50),
    remarks text,
    returned_by_name character varying(255),
    received_by_id integer NOT NULL,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.material_returns OWNER TO postgres;

--
-- Name: material_returns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_returns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_returns_id_seq OWNER TO postgres;

--
-- Name: material_returns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_returns_id_seq OWNED BY public.material_returns.id;


--
-- Name: materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    category_id integer NOT NULL,
    subcategory_id integer,
    uom_id integer NOT NULL,
    reorder_level double precision,
    maximum_level double precision,
    standard_cost double precision,
    preferred_vendor_id integer,
    storage_type character varying(100),
    hsn_code character varying(20),
    gst_rate double precision,
    material_type character varying(50),
    description text,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    warehouse_id integer
);


ALTER TABLE public.materials OWNER TO postgres;

--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materials_id_seq OWNER TO postgres;

--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(255),
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizations_id_seq OWNER TO postgres;

--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    organization_id integer NOT NULL,
    location character varying(255),
    start_date date,
    end_date date,
    status character varying(50),
    budget double precision,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    po_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL,
    rate double precision NOT NULL,
    amount double precision NOT NULL,
    received_quantity double precision,
    remarks text,
    discount_percent double precision DEFAULT 0,
    cgst_percentage double precision DEFAULT 0,
    sgst_percentage double precision DEFAULT 0,
    igst_percentage double precision DEFAULT 0
);


ALTER TABLE public.purchase_order_items OWNER TO postgres;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_items_id_seq OWNER TO postgres;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    vendor_id integer NOT NULL,
    project_id integer NOT NULL,
    pr_id integer,
    indent_id integer,
    qr_id integer,
    po_type character varying(50),
    total_amount double precision,
    delivery_date date,
    status character varying(50),
    terms text,
    created_by_id integer NOT NULL,
    approved_by_id integer,
    approved_at timestamp without time zone,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO postgres;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: purchase_request_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_request_items (
    id integer NOT NULL,
    pr_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL
);


ALTER TABLE public.purchase_request_items OWNER TO postgres;

--
-- Name: purchase_request_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_request_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_request_items_id_seq OWNER TO postgres;

--
-- Name: purchase_request_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_request_items_id_seq OWNED BY public.purchase_request_items.id;


--
-- Name: purchase_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_requests (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    pr_number character varying(50) NOT NULL,
    requester_id integer NOT NULL,
    required_for_room_id integer,
    building_id integer,
    department_name character varying(255),
    project_id integer NOT NULL,
    required_date date NOT NULL,
    remarks text,
    status character varying(50),
    approved_by_id integer,
    approved_at timestamp without time zone,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.purchase_requests OWNER TO postgres;

--
-- Name: purchase_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_requests_id_seq OWNER TO postgres;

--
-- Name: purchase_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_requests_id_seq OWNED BY public.purchase_requests.id;


--
-- Name: quotation_comparisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_comparisons (
    id integer NOT NULL,
    qr_id integer NOT NULL,
    qr_item_id integer NOT NULL,
    material_id integer NOT NULL,
    selected_vendor_id integer NOT NULL,
    auto_rank_vendor_id integer NOT NULL,
    is_overridden boolean,
    override_reason text,
    approved_by_id integer,
    approved_at timestamp without time zone
);


ALTER TABLE public.quotation_comparisons OWNER TO postgres;

--
-- Name: quotation_comparisons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_comparisons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_comparisons_id_seq OWNER TO postgres;

--
-- Name: quotation_comparisons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_comparisons_id_seq OWNED BY public.quotation_comparisons.id;


--
-- Name: quotation_request_item_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_request_item_sources (
    id integer NOT NULL,
    qr_item_id integer NOT NULL,
    source character varying(20) NOT NULL,
    source_pr_id integer,
    quantity double precision NOT NULL
);


ALTER TABLE public.quotation_request_item_sources OWNER TO postgres;

--
-- Name: quotation_request_item_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_request_item_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_request_item_sources_id_seq OWNER TO postgres;

--
-- Name: quotation_request_item_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_request_item_sources_id_seq OWNED BY public.quotation_request_item_sources.id;


--
-- Name: quotation_request_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_request_items (
    id integer NOT NULL,
    qr_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL,
    source character varying(20),
    source_pr_id integer
);


ALTER TABLE public.quotation_request_items OWNER TO postgres;

--
-- Name: quotation_request_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_request_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_request_items_id_seq OWNER TO postgres;

--
-- Name: quotation_request_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_request_items_id_seq OWNED BY public.quotation_request_items.id;


--
-- Name: quotation_request_prs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_request_prs (
    id integer NOT NULL,
    qr_id integer NOT NULL,
    pr_id integer NOT NULL
);


ALTER TABLE public.quotation_request_prs OWNER TO postgres;

--
-- Name: quotation_request_prs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_request_prs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_request_prs_id_seq OWNER TO postgres;

--
-- Name: quotation_request_prs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_request_prs_id_seq OWNED BY public.quotation_request_prs.id;


--
-- Name: quotation_request_vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_request_vendors (
    id integer NOT NULL,
    qr_id integer NOT NULL,
    vendor_id integer NOT NULL,
    is_sent boolean,
    sent_at timestamp without time zone,
    receipt_status character varying(50)
);


ALTER TABLE public.quotation_request_vendors OWNER TO postgres;

--
-- Name: quotation_request_vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_request_vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_request_vendors_id_seq OWNER TO postgres;

--
-- Name: quotation_request_vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_request_vendors_id_seq OWNED BY public.quotation_request_vendors.id;


--
-- Name: quotation_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_requests (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    qr_number character varying(50) NOT NULL,
    project_id integer NOT NULL,
    created_by_id integer NOT NULL,
    required_date date,
    remarks text,
    status character varying(50),
    approved_by_id integer,
    approved_at timestamp without time zone,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.quotation_requests OWNER TO postgres;

--
-- Name: quotation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_requests_id_seq OWNER TO postgres;

--
-- Name: quotation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_requests_id_seq OWNED BY public.quotation_requests.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    resource character varying(100) NOT NULL,
    can_read boolean,
    can_create boolean,
    can_update boolean,
    can_delete boolean,
    extended_actions json DEFAULT '{}'::json
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    description text,
    is_system boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    department_name character varying(255),
    floor_id integer NOT NULL,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO postgres;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sites (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    location character varying(255),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.sites OWNER TO postgres;

--
-- Name: sites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sites_id_seq OWNER TO postgres;

--
-- Name: sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sites_id_seq OWNED BY public.sites.id;


--
-- Name: stock_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_ledger (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    material_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    transaction_type character varying(50) NOT NULL,
    quantity double precision NOT NULL,
    balance double precision,
    reference_type character varying(50),
    reference_id integer,
    reference_number character varying(50),
    project_id integer,
    room_id integer,
    remarks text,
    created_by_id integer,
    created_at timestamp without time zone
);


ALTER TABLE public.stock_ledger OWNER TO postgres;

--
-- Name: stock_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_ledger_id_seq OWNER TO postgres;

--
-- Name: stock_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_ledger_id_seq OWNED BY public.stock_ledger.id;


--
-- Name: stock_transfer_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_transfer_items (
    id integer NOT NULL,
    transfer_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity double precision NOT NULL,
    remarks text
);


ALTER TABLE public.stock_transfer_items OWNER TO postgres;

--
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_transfer_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_transfer_items_id_seq OWNER TO postgres;

--
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_transfer_items_id_seq OWNED BY public.stock_transfer_items.id;


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_transfers (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    transfer_number character varying(50) NOT NULL,
    from_warehouse_id integer NOT NULL,
    to_warehouse_id integer NOT NULL,
    project_id integer NOT NULL,
    status character varying(50),
    remarks text,
    created_by_id integer NOT NULL,
    is_deleted boolean,
    created_at timestamp without time zone,
    completed_at timestamp without time zone
);


ALTER TABLE public.stock_transfers OWNER TO postgres;

--
-- Name: stock_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_transfers_id_seq OWNER TO postgres;

--
-- Name: stock_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_transfers_id_seq OWNED BY public.stock_transfers.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(100) NOT NULL,
    category_id integer NOT NULL,
    is_active boolean,
    is_deleted boolean
);


ALTER TABLE public.subcategories OWNER TO postgres;

--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subcategories_id_seq OWNER TO postgres;

--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: tenant_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_memberships (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tenant_id integer NOT NULL,
    is_active boolean,
    joined_at timestamp without time zone
);


ALTER TABLE public.tenant_memberships OWNER TO postgres;

--
-- Name: tenant_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenant_memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenant_memberships_id_seq OWNER TO postgres;

--
-- Name: tenant_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenant_memberships_id_seq OWNED BY public.tenant_memberships.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    status character varying(50),
    subscription_plan character varying(50),
    max_sites integer,
    created_at timestamp without time zone
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: terms_and_conditions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.terms_and_conditions (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    content text NOT NULL,
    is_default boolean,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.terms_and_conditions OWNER TO postgres;

--
-- Name: terms_and_conditions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.terms_and_conditions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.terms_and_conditions_id_seq OWNER TO postgres;

--
-- Name: terms_and_conditions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.terms_and_conditions_id_seq OWNED BY public.terms_and_conditions.id;


--
-- Name: uom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uom (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(50) NOT NULL,
    abbreviation character varying(10) NOT NULL,
    is_active boolean,
    is_deleted boolean
);


ALTER TABLE public.uom OWNER TO postgres;

--
-- Name: uom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uom_id_seq OWNER TO postgres;

--
-- Name: uom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uom_id_seq OWNED BY public.uom.id;


--
-- Name: user_role_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role_assignments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tenant_id integer NOT NULL,
    role_id integer NOT NULL,
    site_id integer,
    assigned_at timestamp without time zone
);


ALTER TABLE public.user_role_assignments OWNER TO postgres;

--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_role_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_role_assignments_id_seq OWNER TO postgres;

--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_role_assignments_id_seq OWNED BY public.user_role_assignments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    is_active boolean,
    is_platform_admin boolean,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vendor_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_categories (
    id integer NOT NULL,
    vendor_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.vendor_categories OWNER TO postgres;

--
-- Name: vendor_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_categories_id_seq OWNER TO postgres;

--
-- Name: vendor_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_categories_id_seq OWNED BY public.vendor_categories.id;


--
-- Name: vendor_quotation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_quotation_items (
    id integer NOT NULL,
    vendor_quotation_id integer NOT NULL,
    qr_item_id integer NOT NULL,
    material_id integer NOT NULL,
    quoted_rate double precision NOT NULL,
    delivery_days integer,
    is_excluded boolean,
    remarks text
);


ALTER TABLE public.vendor_quotation_items OWNER TO postgres;

--
-- Name: vendor_quotation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_quotation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_quotation_items_id_seq OWNER TO postgres;

--
-- Name: vendor_quotation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_quotation_items_id_seq OWNED BY public.vendor_quotation_items.id;


--
-- Name: vendor_quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_quotations (
    id integer NOT NULL,
    qr_id integer NOT NULL,
    vendor_id integer NOT NULL,
    quotation_number character varying(100),
    quotation_date date,
    received_date date,
    attachment_path character varying(500),
    remarks text,
    status character varying(50),
    entered_by_id integer NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.vendor_quotations OWNER TO postgres;

--
-- Name: vendor_quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_quotations_id_seq OWNER TO postgres;

--
-- Name: vendor_quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_quotations_id_seq OWNED BY public.vendor_quotations.id;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    contact_person character varying(255),
    phone character varying(20),
    email character varying(255),
    gst_number character varying(20),
    pan_number character varying(15),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    bank_name character varying(100),
    bank_account character varying(50),
    ifsc_code character varying(20),
    rating double precision,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Name: vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendors_id_seq OWNER TO postgres;

--
-- Name: vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendors_id_seq OWNED BY public.vendors.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    project_id integer NOT NULL,
    warehouse_type character varying(100),
    location character varying(255),
    capacity character varying(100),
    manager_name character varying(255),
    manager_id integer,
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.warehouses OWNER TO postgres;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO postgres;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: approval_flows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_flows ALTER COLUMN id SET DEFAULT nextval('public.approval_flows_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: buildings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings ALTER COLUMN id SET DEFAULT nextval('public.buildings_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: current_stock id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock ALTER COLUMN id SET DEFAULT nextval('public.current_stock_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: document_sequences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences ALTER COLUMN id SET DEFAULT nextval('public.document_sequences_id_seq'::regclass);


--
-- Name: floors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors ALTER COLUMN id SET DEFAULT nextval('public.floors_id_seq'::regclass);


--
-- Name: gate_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries ALTER COLUMN id SET DEFAULT nextval('public.gate_entries_id_seq'::regclass);


--
-- Name: gate_passes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes ALTER COLUMN id SET DEFAULT nextval('public.gate_passes_id_seq'::regclass);


--
-- Name: grn id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn ALTER COLUMN id SET DEFAULT nextval('public.grn_id_seq'::regclass);


--
-- Name: grn_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn_items ALTER COLUMN id SET DEFAULT nextval('public.grn_items_id_seq'::regclass);


--
-- Name: indent_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_approvals ALTER COLUMN id SET DEFAULT nextval('public.indent_approvals_id_seq'::regclass);


--
-- Name: indent_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_items ALTER COLUMN id SET DEFAULT nextval('public.indent_items_id_seq'::regclass);


--
-- Name: indents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents ALTER COLUMN id SET DEFAULT nextval('public.indents_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: material_issue_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issue_items ALTER COLUMN id SET DEFAULT nextval('public.material_issue_items_id_seq'::regclass);


--
-- Name: material_issues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues ALTER COLUMN id SET DEFAULT nextval('public.material_issues_id_seq'::regclass);


--
-- Name: material_return_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_return_items ALTER COLUMN id SET DEFAULT nextval('public.material_return_items_id_seq'::regclass);


--
-- Name: material_returns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns ALTER COLUMN id SET DEFAULT nextval('public.material_returns_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: purchase_request_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_request_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_request_items_id_seq'::regclass);


--
-- Name: purchase_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests ALTER COLUMN id SET DEFAULT nextval('public.purchase_requests_id_seq'::regclass);


--
-- Name: quotation_comparisons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons ALTER COLUMN id SET DEFAULT nextval('public.quotation_comparisons_id_seq'::regclass);


--
-- Name: quotation_request_item_sources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_item_sources ALTER COLUMN id SET DEFAULT nextval('public.quotation_request_item_sources_id_seq'::regclass);


--
-- Name: quotation_request_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_items ALTER COLUMN id SET DEFAULT nextval('public.quotation_request_items_id_seq'::regclass);


--
-- Name: quotation_request_prs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_prs ALTER COLUMN id SET DEFAULT nextval('public.quotation_request_prs_id_seq'::regclass);


--
-- Name: quotation_request_vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_vendors ALTER COLUMN id SET DEFAULT nextval('public.quotation_request_vendors_id_seq'::regclass);


--
-- Name: quotation_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests ALTER COLUMN id SET DEFAULT nextval('public.quotation_requests_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: sites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites ALTER COLUMN id SET DEFAULT nextval('public.sites_id_seq'::regclass);


--
-- Name: stock_ledger id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger ALTER COLUMN id SET DEFAULT nextval('public.stock_ledger_id_seq'::regclass);


--
-- Name: stock_transfer_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfer_items ALTER COLUMN id SET DEFAULT nextval('public.stock_transfer_items_id_seq'::regclass);


--
-- Name: stock_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers ALTER COLUMN id SET DEFAULT nextval('public.stock_transfers_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: tenant_memberships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_memberships ALTER COLUMN id SET DEFAULT nextval('public.tenant_memberships_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: terms_and_conditions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms_and_conditions ALTER COLUMN id SET DEFAULT nextval('public.terms_and_conditions_id_seq'::regclass);


--
-- Name: uom id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom ALTER COLUMN id SET DEFAULT nextval('public.uom_id_seq'::regclass);


--
-- Name: user_role_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_role_assignments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vendor_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_categories ALTER COLUMN id SET DEFAULT nextval('public.vendor_categories_id_seq'::regclass);


--
-- Name: vendor_quotation_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotation_items ALTER COLUMN id SET DEFAULT nextval('public.vendor_quotation_items_id_seq'::regclass);


--
-- Name: vendor_quotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotations ALTER COLUMN id SET DEFAULT nextval('public.vendor_quotations_id_seq'::regclass);


--
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.vendors_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
05ed00d63012
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, tenant_id, site_id, alert_type, severity, title, message, reference_type, reference_id, project_id, is_read, is_resolved, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: approval_flows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_flows (id, tenant_id, site_id, document_type, level, role_name, min_amount, max_amount, user_id, is_active) FROM stdin;
2	3	3	INDENT	1	Store Manager	55555	\N	5	t
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, tenant_id, site_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) FROM stdin;
1	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-15 10:38:01.227576
2	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-15 10:38:06.501347
3	1	\N	2	LOGIN	User	2	\N	\N	\N	2026-05-15 11:20:41.813136
4	1	\N	2	LOGIN	User	2	\N	\N	\N	2026-05-15 12:01:34.092364
5	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-15 12:03:53.0321
6	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-15 12:07:41.331918
7	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-15 12:11:45.753133
8	3	3	4	UPDATE	Material	2	\N	\N	\N	2026-05-15 12:34:31.409019
9	3	3	4	UPDATE	Material	2	\N	\N	\N	2026-05-15 12:35:03.206064
10	3	3	4	UPDATE	Material	74	\N	\N	\N	2026-05-15 13:01:20.183039
11	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-15 13:31:58.322747
12	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-15 13:32:52.1481
13	1	\N	2	LOGIN	User	2	\N	\N	\N	2026-05-15 13:33:20.845798
14	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-15 13:53:41.804103
15	2	\N	3	LOGIN	User	3	\N	\N	\N	2026-05-15 13:54:13.161993
16	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-15 13:54:56.713239
17	3	3	4	APPROVE	PurchaseRequest	152	\N	\N	\N	2026-05-15 17:09:06.530035
18	3	3	4	APPROVE	PurchaseRequest	152	\N	\N	\N	2026-05-15 17:09:10.15296
19	3	3	4	APPROVE	PurchaseRequest	154	\N	\N	\N	2026-05-15 17:12:11.06919
20	3	3	4	APPROVE	PurchaseRequest	154	\N	\N	\N	2026-05-15 17:12:14.089528
21	3	3	4	APPROVE	PurchaseRequest	153	\N	\N	\N	2026-05-15 17:12:16.390389
22	3	3	4	APPROVE	PurchaseRequest	153	\N	\N	\N	2026-05-15 17:12:20.083258
23	3	3	4	CREATE	GRN	151	\N	GRN GRN-00016 created (PO-Based)	\N	2026-05-15 17:37:46.454078
24	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-18 10:34:05.55796
25	1	\N	2	LOGIN	User	2	\N	\N	\N	2026-05-20 10:36:52.162443
26	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-20 10:37:31.778422
27	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-20 10:43:34.363842
28	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-20 10:53:53.199366
29	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-20 11:01:08.904051
30	3	3	4	UPDATE	Material	216	\N	\N	\N	2026-05-20 12:02:00.712825
31	3	3	4	APPROVE	PurchaseRequest	185	\N	\N	\N	2026-05-20 12:27:52.532014
32	3	3	4	APPROVE	PurchaseRequest	185	\N	\N	\N	2026-05-20 12:27:55.499816
33	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-21 10:17:26.73551
34	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-21 12:09:21.768007
35	2	\N	3	LOGIN	User	3	\N	\N	\N	2026-05-21 16:14:58.321052
36	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-21 16:16:33.989127
37	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-21 17:39:29.555204
38	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-21 18:17:50.750759
39	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-25 12:49:56.002096
40	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-25 12:50:36.827684
41	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-25 12:53:11.593924
42	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-26 12:16:07.385972
43	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-26 14:02:31.218045
44	3	3	4	UPDATE	Material	216	\N	\N	\N	2026-05-26 17:27:45.083787
45	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-05-26 17:39:07.818108
46	1	\N	2	LOGIN	User	2	\N	\N	\N	2026-05-26 17:44:19.975743
47	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-26 17:50:39.814616
48	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-27 12:26:48.184716
49	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-27 14:47:21.28221
50	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-29 10:21:13.173472
51	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-29 10:22:03.459953
52	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-29 17:23:44.143868
53	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-05-29 17:23:48.556535
\.


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buildings (id, tenant_id, site_id, name, code, project_id, is_active, is_deleted, created_at) FROM stdin;
1	3	3	Tower1	BLDG-00001	1	t	f	2026-05-15 12:14:17.940478
2	3	3	Tower2	BLDG-00002	1	t	f	2026-05-15 12:14:28.610068
3	3	3	Tower3	BLDG-00003	1	t	f	2026-05-15 12:14:40.682067
4	2	2	Hospital	BLDG-00001	3	t	f	2026-05-21 16:21:49.868317
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, tenant_id, site_id, name, sequence_number, code, description, is_active, is_deleted) FROM stdin;
41	3	3	Cement	\N	CAT-0001	All types of cement	t	f
42	3	3	Sand & Aggregates	\N	CAT-0002	River sand, M-Sand, Aggregates	t	f
43	3	3	Steel & Reinforcement	\N	CAT-0003	TMT bars, Binding wire	t	f
44	3	3	Bricks & Blocks	\N	CAT-0004	Clay bricks, Fly ash bricks, AAC blocks	t	f
45	3	3	Plumbing & Sanitary	\N	CAT-0005	Pipes, Fittings, Sanitary ware	t	f
46	3	3	Electricals	\N	CAT-0006	Wires, Switches, Lighting	t	f
47	3	3	Paints & Finishes	\N	CAT-0007	Paints, Primers, Putty	t	f
48	3	3	Hardware & Tools	\N	CAT-0008	Nails, Screws, Power tools	t	f
49	3	3	Flooring & Tiling	\N	CAT-0009	Tiles, Marble, Granite	t	f
50	3	3	Wood & Timber	\N	CAT-0010	Plywood, Timber, Doors	t	f
\.


--
-- Data for Name: current_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.current_stock (id, tenant_id, site_id, material_id, warehouse_id, quantity, last_updated) FROM stdin;
380	3	3	227	59	98	2026-05-15 15:24:51.227631
386	3	3	228	48	69	2026-05-15 15:24:51.261579
390	3	3	226	56	53	2026-05-15 15:24:51.280617
399	3	3	237	56	60	2026-05-15 15:24:51.315913
400	3	3	241	56	67	2026-05-15 15:24:51.317774
402	3	3	230	51	34	2026-05-15 15:24:51.326143
485	3	3	220	55	88	2026-05-15 15:54:48.146529
486	3	3	226	55	81	2026-05-15 15:54:48.148708
408	3	3	247	59	27.5	2026-05-15 15:24:51.358509
389	3	3	239	56	50	2026-05-15 15:24:51.636712
387	3	3	239	47	76	2026-05-15 15:24:51.665456
487	3	3	250	48	84	2026-05-15 15:54:48.154367
383	3	3	225	53	87	2026-05-15 15:24:51.69371
395	3	3	246	55	122	2026-05-15 15:26:15.923885
488	3	3	226	48	56	2026-05-15 15:54:48.156273
489	3	3	244	48	65	2026-05-15 15:54:48.158813
381	3	3	220	59	126	2026-05-15 15:26:15.99874
384	3	3	217	60	102.5	2026-05-15 15:26:16.048378
446	3	3	239	58	183	2026-05-15 18:52:30.772163
491	3	3	248	51	97	2026-05-15 15:54:48.166672
396	3	3	240	60	56	2026-05-15 15:26:16.115241
508	3	3	226	58	86	2026-05-15 17:47:32.914193
433	3	3	234	53	181	2026-05-15 15:41:43.968281
437	3	3	236	51	70	2026-05-15 15:41:43.998737
441	3	3	243	49	71	2026-05-15 15:41:44.013749
442	3	3	242	54	53	2026-05-15 15:41:44.020061
443	3	3	239	54	76	2026-05-15 15:41:44.022106
444	3	3	217	54	63	2026-05-15 15:41:44.024332
447	3	3	226	47	83	2026-05-15 15:41:44.038372
450	3	3	221	55	71	2026-05-15 15:41:44.052633
451	3	3	241	60	85	2026-05-15 15:41:44.059013
490	3	3	250	51	126	2026-05-15 15:54:48.168871
453	3	3	239	50	38.5	2026-05-15 15:41:44.071093
455	3	3	219	55	43	2026-05-15 15:41:44.079235
456	3	3	241	55	27.5	2026-05-15 15:41:44.080985
492	3	3	218	57	55	2026-05-15 15:54:48.175415
459	3	3	245	50	47.5	2026-05-15 15:41:44.098502
394	3	3	216	55	114	2026-05-15 15:41:44.110753
440	3	3	247	49	79	2026-05-15 15:41:44.128775
493	3	3	230	57	52	2026-05-15 15:54:48.17728
494	3	3	247	57	72	2026-05-15 15:54:48.179515
460	3	3	230	50	29	2026-05-15 15:41:44.17354
388	3	3	221	47	52	2026-05-15 15:41:44.184356
403	3	3	248	60	31	2026-05-15 15:41:44.188698
398	3	3	246	60	176	2026-05-15 15:44:34.737947
449	3	3	222	55	123	2026-05-15 15:44:34.751739
397	3	3	243	60	148	2026-05-15 15:44:34.790796
382	3	3	250	53	193	2026-05-15 15:44:34.80693
439	3	3	233	51	77	2026-05-15 15:44:34.88261
458	3	3	246	49	24.5	2026-05-15 15:44:34.896213
435	3	3	249	53	91	2026-05-15 15:44:34.900174
448	3	3	229	47	93	2026-05-15 17:47:33.087799
385	3	3	235	60	61	2026-05-15 15:44:34.915785
336	3	3	238	46	46	2026-05-26 18:18:05.52449
481	3	3	244	47	97	2026-05-15 15:54:48.117621
480	3	3	243	47	169	2026-05-15 15:54:48.126675
434	3	3	241	47	186	2026-05-15 15:54:48.129206
482	3	3	247	48	80	2026-05-15 15:54:48.135788
483	3	3	229	48	97	2026-05-15 15:54:48.137826
484	3	3	229	55	84	2026-05-15 15:54:48.144694
496	3	3	241	52	92	2026-05-15 15:54:48.187331
497	3	3	250	52	52	2026-05-15 15:54:48.189745
498	3	3	228	46	89	2026-05-15 15:54:48.197791
499	3	3	219	46	95	2026-05-15 15:54:48.199929
404	3	3	236	60	44.5	2026-05-15 17:47:33.092583
379	3	3	248	59	189.5	2026-05-15 15:54:48.225894
392	3	3	239	59	129.5	2026-05-15 15:54:48.227679
500	3	3	237	52	117.5	2026-05-15 17:47:32.939164
502	3	3	219	48	36	2026-05-15 15:54:48.235277
407	3	3	231	59	64	2026-05-15 15:54:48.242953
503	3	3	235	59	50	2026-05-15 15:54:48.244749
406	3	3	242	59	113	2026-05-15 15:54:48.24689
510	3	3	239	52	122	2026-05-15 17:47:32.946037
452	3	3	221	50	67.5	2026-05-15 15:54:48.267412
501	3	3	231	52	34.5	2026-05-15 15:54:48.295551
504	3	3	231	46	35	2026-05-15 17:37:46.440483
505	3	3	235	46	50	2026-05-15 17:37:46.447445
506	3	3	242	46	43	2026-05-15 17:37:46.454939
507	3	3	242	58	75	2026-05-15 17:47:32.909972
495	3	3	240	52	117	2026-05-15 17:47:32.948047
511	3	3	236	52	178	2026-05-15 17:47:32.950789
513	3	3	234	51	91	2026-05-15 17:47:32.957613
514	3	3	239	51	130	2026-05-15 17:47:32.964918
409	3	3	233	55	217	2026-05-15 18:52:30.864304
515	3	3	221	51	67	2026-05-15 17:47:32.96965
457	3	3	242	49	136.5	2026-05-15 17:47:32.977499
516	3	3	229	49	95	2026-05-15 17:47:32.979647
517	3	3	220	56	68	2026-05-15 17:47:32.987382
519	3	3	241	57	60	2026-05-15 17:47:32.995451
520	3	3	231	57	92	2026-05-15 17:47:32.998461
521	3	3	239	48	76	2026-05-15 17:47:33.005469
522	3	3	225	48	65	2026-05-15 17:47:33.007328
523	3	3	233	48	62	2026-05-15 17:47:33.009572
524	3	3	225	55	28.5	2026-05-15 17:47:33.016349
525	3	3	248	55	42	2026-05-15 17:47:33.018482
527	3	3	238	58	47.5	2026-05-15 17:47:33.026291
401	3	3	238	51	80.5	2026-05-15 17:47:33.106956
391	3	3	236	59	164	2026-05-15 17:47:33.116138
454	3	3	244	50	46.5	2026-05-15 17:47:33.132785
445	3	3	229	58	54	2026-05-15 17:47:33.137115
438	3	3	231	51	46	2026-05-15 17:47:33.140641
479	3	3	239	55	65	2026-05-15 18:52:30.865989
526	3	3	223	58	62	2026-05-15 18:52:30.873778
509	3	3	243	52	80	2026-05-15 18:52:30.992524
393	3	3	232	59	82	2026-05-15 18:52:31.012026
405	3	3	216	57	60.5	2026-05-15 18:52:31.020547
478	3	3	232	46	73	2026-05-15 18:52:31.031369
512	3	3	248	52	53	2026-05-15 18:52:31.03492
436	3	3	245	53	55	2026-05-15 18:52:31.047952
318	3	3	220	47	185	2026-05-15 15:24:51.272374
364	3	3	218	54	96	2026-05-15 15:26:16.138688
349	3	3	224	60	182	2026-05-15 15:24:51.648252
375	3	3	220	52	160	2026-05-15 18:52:30.997207
338	3	3	240	48	128	2026-05-15 15:41:44.140833
326	3	3	228	55	3395	2026-05-20 11:11:02.723881
340	3	3	242	52	98	2026-05-20 11:11:02.774579
464	3	3	247	56	83	2026-05-15 15:44:34.729607
359	3	3	236	48	85	2026-05-15 15:24:51.690161
466	3	3	235	50	146	2026-05-15 17:47:33.07341
410	3	3	247	55	64	2026-05-15 15:26:15.932694
431	3	3	239	49	137	2026-05-15 17:47:32.97587
356	3	3	224	55	156	2026-05-15 15:26:15.942561
428	3	3	249	60	83	2026-05-15 15:44:34.740129
320	3	3	222	47	185	2026-05-15 15:41:43.979955
358	3	3	230	48	85	2026-05-15 15:19:37.749602
324	3	3	226	54	201	2026-05-15 15:26:15.956815
414	3	3	217	47	66	2026-05-15 15:26:15.971509
412	3	3	235	54	139	2026-05-15 15:26:15.979305
472	3	3	238	53	130	2026-05-15 18:52:30.803471
416	3	3	238	54	61	2026-05-15 15:26:15.983263
418	3	3	237	59	70	2026-05-15 15:26:15.996707
419	3	3	243	54	65	2026-05-15 15:26:16.004613
421	3	3	223	54	71	2026-05-15 15:26:16.008724
422	3	3	248	53	55	2026-05-15 15:26:16.015421
423	3	3	235	53	98	2026-05-15 15:26:16.017249
354	3	3	231	55	278	2026-05-15 15:44:34.747439
328	3	3	230	47	1	2026-05-15 16:34:56.901455
426	3	3	242	48	26.5	2026-05-15 15:26:16.0358
427	3	3	231	48	25	2026-05-15 15:26:16.038057
429	3	3	222	60	29.5	2026-05-15 15:26:16.046
477	3	3	232	48	118.5	2026-05-15 18:52:30.821905
461	3	3	222	54	143	2026-05-15 15:54:48.098537
371	3	3	219	53	30.5	2026-05-15 15:26:16.089739
348	3	3	250	54	2927	2026-05-15 15:26:16.103181
366	3	3	246	58	82	2026-05-15 15:54:48.272354
432	3	3	249	54	190.5	2026-05-15 15:54:48.101978
465	3	3	226	50	56	2026-05-15 15:44:34.758308
417	3	3	222	59	78	2026-05-20 12:52:59.887743
362	3	3	220	49	60	2026-05-15 15:26:16.131087
314	3	3	216	54	115	2026-05-15 15:19:36.65486
316	3	3	218	46	1018	2026-05-15 15:19:36.661376
317	3	3	219	54	303	2026-05-15 15:19:36.663625
325	3	3	227	46	4	2026-05-15 15:19:36.68029
329	3	3	231	47	246	2026-05-15 15:19:36.688023
331	3	3	233	54	25	2026-05-15 15:19:36.692338
337	3	3	239	46	7	2026-05-15 15:19:36.704119
341	3	3	243	51	6	2026-05-15 15:19:36.711535
345	3	3	247	52	31	2026-05-15 15:19:36.718793
350	3	3	228	60	84	2026-05-15 15:19:37.70502
353	3	3	235	55	76	2026-05-15 15:19:37.722644
355	3	3	242	55	90	2026-05-15 15:19:37.732147
370	3	3	223	56	26	2026-05-15 15:19:37.79565
365	3	3	250	60	96.5	2026-05-15 15:19:37.809396
332	3	3	234	54	4040	2026-05-15 17:38:16.100561
377	3	3	216	49	44	2026-05-15 15:19:37.829783
378	3	3	248	49	35	2026-05-15 15:19:37.831996
322	3	3	224	46	0	2026-05-26 17:33:32.450609
473	3	3	241	53	62	2026-05-15 17:47:33.080195
333	3	3	235	49	8	2026-05-15 15:19:37.860109
343	3	3	245	47	235	2026-05-15 15:41:44.040295
330	3	3	232	50	8	2026-05-26 18:25:34.291366
346	3	3	248	47	84	2026-05-15 15:54:48.115168
368	3	3	228	56	38.5	2026-05-15 15:19:37.880273
342	3	3	244	55	51	2026-05-15 15:41:44.165711
335	3	3	237	51	8	2026-05-15 15:44:34.891604
363	3	3	244	54	50	2026-05-15 15:19:37.89399
424	3	3	218	60	102.5	2026-05-15 15:41:44.062927
357	3	3	223	55	124	2026-05-15 15:41:44.106851
323	3	3	225	50	11	2026-05-26 18:19:24.670639
347	3	3	249	46	218	2026-05-15 15:54:48.196027
462	3	3	233	56	79	2026-05-15 15:44:34.908322
413	3	3	233	59	49	2026-05-15 15:41:44.180434
415	3	3	237	47	73	2026-05-15 15:54:48.277251
344	3	3	246	48	99	2026-05-15 18:52:30.82376
468	3	3	237	54	97	2026-05-15 15:44:34.77051
376	3	3	233	52	142.5	2026-05-15 15:44:34.778431
334	3	3	236	49	204	2026-05-15 18:52:31.001641
470	3	3	247	60	63	2026-05-15 15:44:34.788539
471	3	3	228	49	50	2026-05-15 15:44:34.79695
430	3	3	238	49	125.5	2026-05-15 15:44:34.798711
474	3	3	234	52	35.5	2026-05-15 15:44:34.814627
476	3	3	222	56	39.5	2026-05-15 15:44:34.82239
463	3	3	242	56	124	2026-05-15 15:44:34.824201
315	3	3	217	46	112	2026-05-15 18:52:31.016242
339	3	3	241	46	66	2026-05-15 18:52:31.024473
367	3	3	228	58	68	2026-05-15 15:44:34.924303
352	3	3	249	55	139	2026-05-15 15:44:34.928441
319	3	3	221	52	152	2026-05-15 15:54:48.205624
321	3	3	223	47	96	2026-05-15 17:47:33.096227
475	3	3	222	52	66	2026-05-15 15:54:48.219453
425	3	3	235	48	72.5	2026-05-15 15:54:48.237078
361	3	3	219	49	129	2026-05-15 15:54:48.291142
351	3	3	232	55	46	2026-05-15 15:54:48.29965
373	3	3	232	60	41	2026-05-15 15:54:48.30732
469	3	3	227	60	75	2026-05-15 15:54:48.31184
420	3	3	245	54	96	2026-05-15 15:54:48.32067
369	3	3	250	56	133	2026-05-15 17:47:33.120829
372	3	3	220	53	159.5	2026-05-15 17:47:33.128865
467	3	3	247	54	158	2026-05-15 18:52:30.830983
411	3	3	228	54	182	2026-05-15 18:52:30.833114
374	3	3	233	60	166.5	2026-05-15 18:52:30.846946
360	3	3	224	48	161	2026-05-15 18:52:30.881407
327	3	3	229	46	71	2026-05-15 18:52:31.038678
518	3	3	242	57	104	2026-05-15 17:47:33.032328
528	3	3	220	57	27	2026-05-15 17:47:33.034742
530	3	3	230	49	45.5	2026-05-15 17:47:33.042948
531	3	3	233	49	49	2026-05-15 17:47:33.044918
532	3	3	218	55	27	2026-05-15 17:47:33.05119
533	3	3	250	55	39	2026-05-15 17:47:33.05332
534	3	3	227	55	43.5	2026-05-15 17:47:33.055784
529	3	3	239	57	31.5	2026-05-15 17:47:33.111345
535	3	3	218	58	58	2026-05-15 18:52:30.767724
537	3	3	240	54	56	2026-05-15 18:52:30.782633
539	3	3	238	59	97	2026-05-15 18:52:30.791972
540	3	3	230	53	62	2026-05-15 18:52:30.798739
541	3	3	243	53	90	2026-05-15 18:52:30.800722
542	3	3	224	51	71	2026-05-15 18:52:30.81069
543	3	3	246	51	56	2026-05-15 18:52:30.812706
544	3	3	242	51	95	2026-05-15 18:52:30.815074
536	3	3	232	54	150	2026-05-15 18:52:30.82924
545	3	3	218	59	74	2026-05-15 18:52:30.838992
546	3	3	225	59	91	2026-05-15 18:52:30.840875
547	3	3	234	60	92	2026-05-15 18:52:30.848691
548	3	3	226	60	68	2026-05-15 18:52:30.85091
550	3	3	225	54	69	2026-05-15 18:52:30.858285
551	3	3	230	58	48.5	2026-05-15 18:52:30.871941
552	3	3	249	58	41.5	2026-05-15 18:52:30.87601
553	3	3	220	48	48.5	2026-05-15 18:52:30.88307
554	3	3	218	48	25	2026-05-15 18:52:30.885456
555	3	3	225	47	49.5	2026-05-15 18:52:30.892117
549	3	3	241	54	76	2026-05-15 18:52:30.986234
557	3	3	246	46	42.5	2026-05-15 18:52:31.006869
556	3	3	216	47	42	2026-05-15 18:52:31.043239
558	3	3	244	56	0	2026-05-20 12:47:03.329355
559	3	3	230	56	0	2026-05-20 12:50:39.839919
538	3	3	246	59	85	2026-05-20 12:51:33.8159
560	3	3	230	59	1	2026-05-20 12:53:43.088482
561	3	3	230	61	1	2026-05-20 12:59:53.319596
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, tenant_id, site_id, name, code, accounting_code, building_id, is_active, is_deleted, created_at) FROM stdin;
1	3	3	CIVIL	DEPT-00001	\N	1	t	f	2026-05-15 13:15:35.449236
2	3	3	ADMIN	DEPT-00002	\N	1	t	f	2026-05-15 13:19:20.067632
3	2	2	Physiotherapy Dept	DEPT-00001	\N	4	t	f	2026-05-21 16:31:55.999016
\.


--
-- Data for Name: document_sequences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_sequences (id, tenant_id, site_id, document_type, prefix, current_number) FROM stdin;
1	3	3	ORGANIZATION	ORG	1
2	3	3	PROJECT	PROJ	2
29	2	2	BUILDING	BLDG	1
3	3	3	BUILDING	BLDG	3
30	2	2	DEPARTMENT	DEPT	1
13	3	3	PURCHASE_ORDER	PO	24
6	3	3	DEPARTMENT	DEPT	2
4	3	3	ROOM	RM	2
5	3	3	INDENT	IND	23
11	3	3	ISSUE	ISS	25
15	3	3	GRN	GRN	16
14	3	3	GATE_ENTRY	GE	17
17	3	3	MATERIAL	MAT	35
18	3	3	CATEGORY	CAT	10
19	3	3	VENDOR	VND	10
26	3	3	GATEPASS	GP	2
25	3	3	RETURN	RET	6
12	3	3	PURCHASE_REQUEST	PR	21
16	3	3	QUOTATION_REQUEST	QR	18
27	2	2	ORGANIZATION	ORG	1
28	2	2	PROJECT	PROJ	1
\.


--
-- Data for Name: floors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.floors (id, tenant_id, site_id, name, level, building_id, is_active, is_deleted, created_at) FROM stdin;
1	3	3	Ground Floor	0	1	t	f	2026-05-15 12:19:09.73572
6	3	3	Ground floor	0	2	t	f	2026-05-15 12:24:34.804756
7	3	3	1	1	2	t	f	2026-05-15 12:25:04.364684
8	3	3	2	2	2	t	f	2026-05-15 12:25:29.061682
9	3	3	Floor1	1	3	t	f	2026-05-15 15:43:19.625551
4	3	3	Floor 1	1	1	t	f	2026-05-15 12:23:09.04142
2	3	3	Floor 2	2	1	t	f	2026-05-15 12:19:37.70249
3	3	3	Floor 3	3	1	t	f	2026-05-15 12:21:57.777667
5	3	3	Floor 4	4	1	t	f	2026-05-15 12:23:47.539477
10	2	2	Basement	0	4	t	f	2026-05-21 16:23:03.219982
11	2	2	Ground Floor	1	4	t	f	2026-05-21 16:23:40.244112
12	2	2	1st Floor	2	4	t	f	2026-05-21 16:24:50.428678
13	2	2	2nd Floor	3	4	t	f	2026-05-21 16:25:09.460793
\.


--
-- Data for Name: gate_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gate_entries (id, tenant_id, site_id, entry_number, vehicle_number, vendor_id, po_id, project_id, material_id, quantity, arrival_time, driver_name, driver_phone, delivery_person_name, entry_type, photo_url, invoice_scan_url, remarks, status, recorded_by_id, is_deleted, created_at) FROM stdin;
168	3	3	GE-00001	KA-01-HH-9073	54	170	\N	\N	\N	2026-04-26 18:52:30.375564	Sunil Yadav	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744964
169	3	3	GE-00002	KA-01-HH-5693	53	171	\N	\N	\N	2026-04-27 18:52:30.375564	Manoj Kumar	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744977
170	3	3	GE-00003	KA-01-HH-5456	54	172	\N	\N	\N	2026-04-28 18:52:30.375564	Manoj Kumar	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744981
171	3	3	GE-00004	KA-01-HH-1889	51	173	\N	\N	\N	2026-04-29 18:52:30.375564	Amit Sharma	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744985
172	3	3	GE-00005	KA-01-HH-7150	59	174	\N	\N	\N	2026-04-30 18:52:30.375564	Amit Sharma	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744988
173	3	3	GE-00006	KA-01-HH-1973	60	175	\N	\N	\N	2026-05-01 18:52:30.375564	Vikram Singh	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744991
174	3	3	GE-00007	KA-01-HH-4766	56	176	\N	\N	\N	2026-05-02 18:52:30.375564	Vikram Singh	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744994
175	3	3	GE-00008	KA-01-HH-8357	52	177	\N	\N	\N	2026-05-03 18:52:30.375564	Sunil Yadav	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.744997
176	3	3	GE-00009	KA-01-HH-4396	60	178	\N	\N	\N	2026-05-04 18:52:30.375564	Manoj Kumar	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.745
177	3	3	GE-00010	KA-01-HH-1293	60	179	\N	\N	\N	2026-05-05 18:52:30.375564	Vikram Singh	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.745003
178	3	3	GE-00011	KA-01-HH-2993	58	180	\N	\N	\N	2026-05-06 18:52:30.375564	Deepak Gupta	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.745007
179	3	3	GE-00012	KA-01-HH-1818	53	181	\N	\N	\N	2026-05-07 18:52:30.375564	Vikram Singh	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.74501
180	3	3	GE-00013	KA-01-HH-7978	55	182	\N	\N	\N	2026-05-08 18:52:30.375564	Suresh Raina	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.745013
181	3	3	GE-00014	KA-01-HH-1520	52	183	\N	\N	\N	2026-05-09 18:52:30.375564	Amit Sharma	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.745016
182	3	3	GE-00015	KA-01-HH-8667	52	184	\N	\N	\N	2026-05-10 18:52:30.375564	Vikram Singh	\N	\N	Vehicle	\N	\N	\N	Completed	4	f	2026-05-15 18:52:30.745019
\.


--
-- Data for Name: gate_passes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gate_passes (id, tenant_id, site_id, gate_pass_number, return_id, project_id, material_id, quantity, vendor_id, status, gate_pass_type, driver_name, vehicle_number, remarks, created_by_id, created_at) FROM stdin;
1	3	3	GP-00001	6	1	244	2	58	Pending Repair	Outward Repair	\N	\N	\N	4	2026-05-20 12:47:03.327093
2	3	3	GP-00002	9	1	230	2	51	Pending Repair	Outward Repair	\N	\N	\N	4	2026-05-20 12:50:39.837946
\.


--
-- Data for Name: grn; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grn (id, tenant_id, site_id, grn_number, po_id, gate_entry_id, warehouse_id, project_id, vendor_id, receipt_type, invoice_number, invoice_date, invoice_amount, invoice_scan_url, vendor_gstin, total_taxable_amount, total_cgst, total_sgst, total_igst, total_tax, eway_bill_number, payment_status, status, remarks, received_by_id, is_deleted, created_at, completed_at, invoice_id) FROM stdin;
170	3	3	GRN-00004	173	171	53	1	51	PO-Based	INV-492	2026-04-29	158700.81	\N	\N	158700.81	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-04-30 18:52:30.375564	\N	\N
171	3	3	GRN-00005	174	172	51	1	59	PO-Based	INV-615	2026-04-30	94040.94	\N	\N	94040.94	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-01 18:52:30.375564	\N	\N
172	3	3	GRN-00006	175	173	48	1	60	PO-Based	INV-738	2026-05-01	106458.67	\N	\N	106458.67	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-02 18:52:30.375564	\N	\N
173	3	3	GRN-00007	176	174	54	1	56	PO-Based	INV-861	2026-05-02	154430.78	\N	\N	154430.78	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-03 18:52:30.375564	\N	\N
174	3	3	GRN-00008	177	175	59	1	52	PO-Based	INV-984	2026-05-03	65342.52	\N	\N	65342.52	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-04 18:52:30.375564	\N	\N
175	3	3	GRN-00009	178	176	60	1	60	PO-Based	INV-1107	2026-05-04	147399.24	\N	\N	147399.24	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-05 18:52:30.375564	\N	\N
176	3	3	GRN-00010	179	177	54	1	60	PO-Based	INV-1230	2026-05-05	85728.76	\N	\N	85728.76	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-06 18:52:30.375564	\N	\N
177	3	3	GRN-00011	180	178	55	1	58	PO-Based	INV-1353	2026-05-06	30270.74	\N	\N	30270.74	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-07 18:52:30.375564	\N	\N
167	3	3	GRN-00001	170	168	58	1	54	PO-Based	INV-123	2026-04-26	59200.56	\N	\N	59200.56	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-04-27 18:52:30.375564	\N	\N
168	3	3	GRN-00002	171	169	54	1	53	PO-Based	INV-246	2026-04-27	90907.27	\N	\N	90907.27	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-04-28 18:52:30.375564	\N	\N
169	3	3	GRN-00003	172	170	59	1	54	PO-Based	INV-369	2026-04-28	41190.84	\N	\N	41190.84	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-04-29 18:52:30.375564	\N	\N
178	3	3	GRN-00012	181	179	58	1	53	PO-Based	INV-1476	2026-05-07	62495.93	\N	\N	62495.93	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-08 18:52:30.375564	\N	\N
179	3	3	GRN-00013	182	180	48	1	55	PO-Based	INV-1599	2026-05-08	75249.91	\N	\N	75249.91	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-09 18:52:30.375564	\N	\N
180	3	3	GRN-00014	183	181	47	1	52	PO-Based	INV-1722	2026-05-09	19439.09	\N	\N	19439.09	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-10 18:52:30.375564	\N	\N
181	3	3	GRN-00015	184	182	46	1	52	PO-Based	INV-1845	2026-05-10	40821.81	\N	\N	40821.81	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-11 18:52:30.375564	\N	\N
\.


--
-- Data for Name: grn_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grn_items (id, grn_id, material_id, po_item_id, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, rate, hsn_code, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, taxable_amount, discount_percent, remarks) FROM stdin;
427	167	218	429	58	58	58	0	622.6622167227453	\N	0	0	0	0	0	0	36114.41	0	\N
428	167	239	430	91	91	91	0	253.6939034329821	\N	0	0	0	0	0	0	23086.15	0	\N
429	168	232	431	65	65	65	0	798.1819576699139	\N	0	0	0	0	0	0	51881.83	0	\N
430	168	240	432	56	56	56	0	696.8829291257548	\N	0	0	0	0	0	0	39025.44	0	\N
431	169	246	433	84	84	84	0	197.81912785609876	\N	0	0	0	0	0	0	16616.81	0	\N
432	169	238	434	97	97	97	0	253.34053491222318	\N	0	0	0	0	0	0	24574.03	0	\N
433	170	230	435	62	62	62	0	192.2993441237083	\N	0	0	0	0	0	0	11922.56	0	\N
434	170	243	436	90	90	90	0	994.4289709813414	\N	0	0	0	0	0	0	89498.61	0	\N
435	170	238	437	71	71	71	0	806.7554735846641	\N	0	0	0	0	0	0	57279.64	0	\N
436	171	224	438	71	71	71	0	334.9202790083316	\N	0	0	0	0	0	0	23779.34	0	\N
437	171	246	439	56	56	56	0	508.96937256607197	\N	0	0	0	0	0	0	28502.28	0	\N
438	171	242	440	95	95	95	0	439.5717729224421	\N	0	0	0	0	0	0	41759.32	0	\N
439	172	232	441	74	74	74	0	675.8070276461146	\N	0	0	0	0	0	0	50009.72	0	\N
440	172	246	442	89	89	89	0	634.2578091137547	\N	0	0	0	0	0	0	56448.95	0	\N
441	173	232	443	85	85	85	0	594.0766791418163	\N	0	0	0	0	0	0	50496.52	0	\N
442	173	247	444	64	64	64	0	701.4487310737563	\N	0	0	0	0	0	0	44892.72	0	\N
443	173	228	445	83	83	83	0	711.3438532048493	\N	0	0	0	0	0	0	59041.54	0	\N
444	174	218	446	74	74	74	0	647.1637484242935	\N	0	0	0	0	0	0	47890.12	0	\N
445	174	225	447	91	91	91	0	191.78461295519767	\N	0	0	0	0	0	0	17452.4	0	\N
446	175	233	448	95	95	95	0	935.3112394708419	\N	0	0	0	0	0	0	88854.57	0	\N
447	175	234	449	92	92	92	0	432.82727673690107	\N	0	0	0	0	0	0	39820.11	0	\N
448	175	226	450	68	68	68	0	275.36110705289536	\N	0	0	0	0	0	0	18724.56	0	\N
449	176	241	451	78	78	78	0	264.13122536831014	\N	0	0	0	0	0	0	20602.24	0	\N
450	176	225	452	69	69	69	0	943.8626677712014	\N	0	0	0	0	0	0	65126.52	0	\N
451	177	233	453	53	26.5	26.5	0	539.9784949830348	\N	0	0	0	0	0	0	14309.43	0	\N
452	177	239	454	60	30	30	0	532.0437912494651	\N	0	0	0	0	0	0	15961.31	0	\N
453	178	230	455	97	48.5	48.5	0	962.7152002510661	\N	0	0	0	0	0	0	46691.69	0	\N
454	178	223	456	64	32	32	0	229.8715053415311	\N	0	0	0	0	0	0	7355.89	0	\N
455	178	249	457	83	41.5	41.5	0	203.5747618485592	\N	0	0	0	0	0	0	8448.35	0	\N
456	179	224	458	72	36	36	0	549.1646849218906	\N	0	0	0	0	0	0	19769.93	0	\N
457	179	220	459	97	48.5	48.5	0	654.0399719667862	\N	0	0	0	0	0	0	31720.94	0	\N
458	179	218	460	50	25	25	0	950.3615053957224	\N	0	0	0	0	0	0	23759.04	0	\N
459	180	225	461	99	49.5	49.5	0	184.0140348665117	\N	0	0	0	0	0	0	9108.69	0	\N
460	180	216	462	86	43	43	0	240.2417955239404	\N	0	0	0	0	0	0	10330.4	0	\N
461	181	246	463	93	46.5	46.5	0	501.93278196332733	\N	0	0	0	0	0	0	23339.87	0	\N
462	181	232	464	54	27	27	0	647.4793131186962	\N	0	0	0	0	0	0	17481.94	0	\N
\.


--
-- Data for Name: indent_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.indent_approvals (id, indent_id, approval_flow_id, approver_id, approved_at) FROM stdin;
\.


--
-- Data for Name: indent_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.indent_items (id, indent_id, material_id, requested_quantity, issued_quantity, acknowledged_quantity) FROM stdin;
419	179	216	20	9	0
420	179	223	39	2	0
421	180	243	12	1	0
422	180	249	15	6	0
423	181	236	42	9	0
424	181	218	19	5	0
425	181	240	46	1	0
428	183	247	13	6	0
429	183	234	38	10	0
430	184	223	36	0	0
431	184	241	36	3	0
432	185	239	39	6	0
433	185	242	45	9	0
434	185	232	22	4	0
437	187	249	41	6	0
438	187	240	23	10	0
439	187	225	32	8	0
440	188	249	18	0	0
441	188	243	40	0	0
442	188	249	43	0	0
443	189	240	31	6	0
444	189	220	27	7	0
445	189	223	27	7	0
446	190	247	48	0	0
447	190	249	21	0	0
448	190	229	14	0	0
449	191	228	16	0	0
450	191	222	23	0	0
451	192	244	41	0	0
452	192	243	16	0	0
453	192	229	17	0	0
454	193	219	26	0	0
455	193	217	50	0	0
456	193	230	34	0	0
435	186	228	15	15	0
436	186	242	19	19	0
458	195	224	100	0	0
457	194	224	100	5	0
427	182	238	21	21	0
426	182	225	25	25	0
459	196	222	25	0	0
460	196	232	40	40	0
\.


--
-- Data for Name: indents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.indents (id, tenant_id, site_id, indent_number, requester_id, room_id, building_id, floor, location, department, remarks, total_amount, status, current_approval_level, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
188	3	3	IND-00010	4	1	1	Floor 1	\N	Civil	\N	0	Converted to PO	1	\N	\N	f	2026-04-20 18:52:30.375564	2026-05-20 11:09:40.430772
186	3	3	IND-00008	4	1	1	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-19 18:52:30.375564	2026-05-20 11:11:02.774926
195	3	3	IND-00022	4	2	1	Floor 1	Room1	CIVIL	General	6500000	Converted to PO	1	\N	2026-05-20 07:13:59.374666	f	2026-05-20 12:43:53.178501	2026-05-20 12:44:10.337933
194	3	3	IND-00021	4	2	1	Floor 1	Room1	CIVIL		6500000	Partially Issued	1	\N	2026-05-26 09:56:13.62006	f	2026-05-20 10:55:54.69627	2026-05-26 17:33:32.452744
182	3	3	IND-00004	4	2	3	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-17 18:52:30.375564	2026-05-26 18:19:24.672223
196	3	3	IND-00023	4	1	1	Ground Floor	Room1	CIVIL		13325	Partially Issued	1	\N	2026-05-26 12:55:06.808856	f	2026-05-26 18:24:51.88147	2026-05-26 18:25:34.291833
179	3	3	IND-00001	4	1	1	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-16 06:52:30.375564	2026-05-15 18:52:30.376955
180	3	3	IND-00002	4	1	3	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-16 18:52:30.375564	2026-05-15 18:52:30.379177
181	3	3	IND-00003	4	1	3	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-17 06:52:30.375564	2026-05-15 18:52:30.382076
183	3	3	IND-00005	4	2	2	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-18 06:52:30.375564	2026-05-15 18:52:30.385998
184	3	3	IND-00006	4	2	3	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-18 18:52:30.375564	2026-05-15 18:52:30.387969
185	3	3	IND-00007	4	2	3	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-19 06:52:30.375564	2026-05-15 18:52:30.389676
187	3	3	IND-00009	4	2	1	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-20 06:52:30.375564	2026-05-15 18:52:30.392759
189	3	3	IND-00011	4	1	2	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-21 06:52:30.375564	2026-05-15 18:52:30.395849
190	3	3	IND-00012	4	1	2	Floor 1	\N	Civil	\N	0	Awaiting Approval	1	\N	\N	f	2026-04-21 18:52:30.375564	2026-05-15 18:52:30.397383
191	3	3	IND-00013	4	2	2	Floor 1	\N	Civil	\N	0	Awaiting Approval	1	\N	\N	f	2026-04-22 06:52:30.375564	2026-05-15 18:52:30.398946
192	3	3	IND-00014	4	2	1	Floor 1	\N	Civil	\N	0	Awaiting Approval	1	\N	\N	f	2026-04-22 18:52:30.375564	2026-05-15 18:52:30.400594
193	3	3	IND-00015	4	1	2	Floor 1	\N	Civil	\N	0	Awaiting Approval	1	\N	\N	f	2026-04-23 06:52:30.375564	2026-05-15 18:52:30.402472
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, material_id, description, hsn_sac, quantity, rate, uom, discount_percent, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, taxable_amount, amount) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, tenant_id, site_id, invoice_number, invoice_date, gate_entry_id, vendor_id, po_id, total_amount, tax_amount, status, scan_url, remarks, created_by_id, is_deleted, created_at, updated_at, eway_bill_number, delivery_note, delivery_note_date, payment_terms, reference_number, reference_date, dispatch_doc_number, dispatched_through, destination, lr_rr_number, vehicle_number, terms_of_delivery, total_taxable_amount, total_cgst, total_sgst, total_igst, total_discount) FROM stdin;
\.


--
-- Data for Name: material_issue_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_issue_items (id, issue_id, material_id, quantity, rate, remarks) FROM stdin;
167	190	241	2	450	\N
168	191	243	4	12000	\N
169	192	220	1	650	\N
170	193	236	1	250	\N
171	194	246	4	1800	\N
172	195	232	2	280	\N
173	196	217	5	150	\N
174	197	216	2	1200	\N
175	198	241	3	450	\N
176	199	224	5	65000	\N
177	200	232	4	280	\N
178	201	248	2	9200	\N
179	202	229	3	12500	\N
180	203	216	1	1200	\N
181	204	245	4	120	\N
182	205	228	15	45	\N
183	206	242	19	3500	\N
184	207	224	5	65000	\N
185	208	238	21	65000	\N
186	209	225	25	750	\N
187	210	232	40	280	\N
\.


--
-- Data for Name: material_issues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_issues (id, tenant_id, site_id, issue_number, warehouse_id, project_id, indent_id, building_id, issued_to_room_id, issued_to_department, issued_to_contractor, purpose, status, issued_by_id, received_by_name, is_acknowledged, acknowledged_at, acknowledged_by_id, acknowledgement_remarks, is_deleted, created_at) FROM stdin;
190	3	3	ISS-00001	54	1	\N	2	2	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-01 18:52:30.375564
191	3	3	ISS-00002	52	1	\N	3	2	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-02 18:52:30.375564
192	3	3	ISS-00003	52	1	\N	1	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-03 18:52:30.375564
193	3	3	ISS-00004	49	1	\N	3	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-04 18:52:30.375564
194	3	3	ISS-00005	46	1	\N	3	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-05 18:52:30.375564
195	3	3	ISS-00006	59	1	\N	3	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-06 18:52:30.375564
196	3	3	ISS-00007	46	1	\N	2	2	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-07 18:52:30.375564
197	3	3	ISS-00008	57	1	\N	2	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-08 18:52:30.375564
198	3	3	ISS-00009	46	1	\N	1	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-09 18:52:30.375564
199	3	3	ISS-00010	46	1	\N	2	2	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-10 18:52:30.375564
200	3	3	ISS-00011	46	1	\N	2	2	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-11 18:52:30.375564
201	3	3	ISS-00012	52	1	\N	3	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-12 18:52:30.375564
202	3	3	ISS-00013	46	1	\N	1	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-13 18:52:30.375564
203	3	3	ISS-00014	47	1	\N	1	1	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-14 18:52:30.375564
204	3	3	ISS-00015	53	1	\N	1	2	CIVIL	\N	\N	Issued	4	\N	f	\N	\N	\N	f	2026-05-15 18:52:30.375564
205	3	3	ISS-00020	55	1	186	1	1	CIVIL	\N	Fulfillment for IND-00008	Completed	4	\N	f	\N	\N	\N	f	2026-05-20 11:11:02.704331
206	3	3	ISS-00021	52	1	186	1	1	CIVIL	\N	Fulfillment for IND-00008	Completed	4	\N	f	\N	\N	\N	f	2026-05-20 11:11:02.769222
207	3	3	ISS-00022	46	1	194	1	2	CIVIL	\N	Fulfillment for IND-00021	Completed	4	\N	f	\N	\N	\N	f	2026-05-26 17:33:32.403852
208	3	3	ISS-00023	46	1	182	3	2	CIVIL	\N	Fulfillment for IND-00004	Completed	4	\N	f	\N	\N	\N	f	2026-05-26 18:18:05.503323
209	3	3	ISS-00024	50	1	182	3	2	CIVIL	\N	Fulfillment for IND-00004	Completed	4	\N	f	\N	\N	\N	f	2026-05-26 18:19:24.650895
210	3	3	ISS-00025	50	1	196	1	1	CIVIL	\N	Fulfillment for IND-00023	Completed	4	\N	f	\N	\N	\N	f	2026-05-26 18:25:34.285748
\.


--
-- Data for Name: material_return_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_return_items (id, return_id, material_id, quantity, condition, remarks) FROM stdin;
1	6	244	2	Repairable	
2	9	230	2	Repairable	
3	10	246	1	Poor	
4	11	222	10	Usable	
5	12	230	1	Usable	
6	15	230	1	Scrap	
\.


--
-- Data for Name: material_returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_returns (id, tenant_id, site_id, return_number, warehouse_id, project_id, returned_from_room_id, returned_from_department, return_type, remarks, returned_by_name, received_by_id, is_deleted, created_at) FROM stdin;
6	3	3	RET-00001	56	1	\N	CIVIL	Damaged	abcd	abc	4	f	2026-05-20 12:47:03.263719
9	3	3	RET-00002	56	1	\N	CIVIL	Scrap		Ram	4	f	2026-05-20 12:50:39.830354
10	3	3	RET-00003	59	1	\N	CIVIL	Scrap		General	4	f	2026-05-20 12:51:33.814251
11	3	3	RET-00004	59	1	\N	CIVIL	Unused			4	f	2026-05-20 12:52:59.884987
12	3	3	RET-00005	59	1	\N	CIVIL	Wrong Item		Raju	4	f	2026-05-20 12:53:43.085522
15	3	3	RET-00006	56	1	\N	CIVIL	Scrap			4	f	2026-05-20 12:59:53.290802
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materials (id, tenant_id, site_id, code, name, category_id, subcategory_id, uom_id, reorder_level, maximum_level, standard_cost, preferred_vendor_id, storage_type, hsn_code, gst_rate, material_type, description, is_active, is_deleted, created_at, updated_at, warehouse_id) FROM stdin;
217	3	3	MAT-00002	Concrete Curing Agent	41	\N	7	50	152	150	59	Covered	\N	18	Consumable	Liquid curing compound for moisture retention in concrete.	t	f	2026-05-15 15:19:36.653752	2026-05-15 15:19:36.653761	46
218	3	3	MAT-00003	Plywood 18mm	50	\N	10	500	2329	110	58	Covered	\N	18	Consumable	Commercial grade MR plywood for shuttering and furniture.	t	f	2026-05-15 15:19:36.6582	2026-05-15 15:19:36.658211	46
219	3	3	MAT-00004	M-Sand	42	\N	3	80	305	800	59	Open Yard	\N	5	Consumable	Manufactured sand as an eco-friendly alternative to river sand.	t	f	2026-05-15 15:19:36.660714	2026-05-15 15:19:36.660724	54
220	3	3	MAT-00005	Iron Pickaxe	48	\N	5	30	105	650	51	Warehouse	\N	18	Non-Consumable	Double-headed pickaxe for hard soil excavation.	t	f	2026-05-15 15:19:36.663008	2026-05-15 15:19:36.663017	47
221	3	3	MAT-00006	Safety Shoes	48	\N	15	50	193	1200	51	Warehouse	\N	18	Consumable	Steel-toe safety shoes for site engineers and workers.	t	f	2026-05-15 15:19:36.665184	2026-05-15 15:19:36.665193	52
222	3	3	MAT-00007	Binding Wire	43	\N	6	50	165	85	60	Covered	\N	18	Consumable	Annealed binding wire for securing reinforcement bars.	t	f	2026-05-15 15:19:36.667488	2026-05-15 15:19:36.667497	47
223	3	3	MAT-00008	Steel Shovel	48	\N	5	50	244	450	59	Warehouse	\N	18	Non-Consumable	Heavy-duty steel shovel with wooden handle.	t	f	2026-05-15 15:19:36.669739	2026-05-15 15:19:36.669748	47
224	3	3	MAT-00009	12mm TMT Bars	43	\N	2	10	43	65000	58	Open Yard	\N	18	Consumable	High-ductility TMT bars for reinforcement.	t	f	2026-05-15 15:19:36.671618	2026-05-15 15:19:36.671627	46
225	3	3	MAT-00010	Wall Putty 40kg	47	\N	1	30	91	750	58	Covered	\N	5	Consumable	White cement-based putty for wall leveling.	t	f	2026-05-15 15:19:36.673573	2026-05-15 15:19:36.673585	50
226	3	3	MAT-00011	Aggregates 20mm	42	\N	3	40	172	950	57	Open Yard	\N	5	Consumable	Crushed stone aggregates for structural concrete.	t	f	2026-05-15 15:19:36.675725	2026-05-15 15:19:36.675737	54
227	3	3	MAT-00012	Digital Theodolite	48	\N	5	1	5	85000	55	Warehouse	\N	18	Non-Consumable	Precision surveying instrument for angle measurement.	t	f	2026-05-15 15:19:36.67779	2026-05-15 15:19:36.6778	46
228	3	3	MAT-00013	Vitrified Tiles 600x600	49	\N	10	1000	3294	45	58	Covered	\N	18	Consumable	Double-charged vitrified tiles for flooring.	t	f	2026-05-15 15:19:36.679809	2026-05-15 15:19:36.679818	55
229	3	3	MAT-00014	Teak Wood Door 3x7	50	\N	5	20	82	12500	59	Covered	\N	18	Consumable	Solid teak wood main doors for apartments.	t	f	2026-05-15 15:19:36.681654	2026-05-15 15:19:36.681663	46
230	3	3	MAT-00015	Bosch Hand Grinder 4 inch	48	\N	5	5	20	4500	51	Warehouse	\N	18	Non-Consumable	Power tool for cutting and grinding steel/masonry.	t	f	2026-05-15 15:19:36.683571	2026-05-15 15:19:36.68358	47
231	3	3	MAT-00016	Screws 1 inch	48	\N	14	100	317	450	52	Warehouse	\N	18	Consumable	Zinc-coated wood screws for carpentry.	t	f	2026-05-15 15:19:36.685536	2026-05-15 15:19:36.685546	47
232	3	3	MAT-00017	Emulsion White Paint	47	\N	7	40	121	280	57	Covered	\N	18	Consumable	Premium interior emulsion for smooth wall finish.	t	f	2026-05-15 15:19:36.687479	2026-05-15 15:19:36.687491	50
233	3	3	MAT-00018	Heavy-duty Wheelbarrow	48	\N	5	20	76	4800	52	Open Yard	\N	18	Non-Consumable	Steel body wheelbarrow for material transport.	t	f	2026-05-15 15:19:36.689535	2026-05-15 15:19:36.689545	54
234	3	3	MAT-00019	AAC Blocks 4 inch	44	\N	5	2000	9155	65	52	Open Yard	\N	12	Consumable	Lightweight Autoclaved Aerated Concrete blocks.	t	f	2026-05-15 15:19:36.691671	2026-05-15 15:19:36.691684	54
235	3	3	MAT-00020	Water Tank 1000L	45	\N	5	10	44	6500	60	Open Yard	\N	18	Consumable	Triple-layered HDPE water storage tank.	t	f	2026-05-15 15:19:36.694238	2026-05-15 15:19:36.69425	49
236	3	3	MAT-00021	PVC Pipe 4 inch	45	\N	8	100	333	250	54	Covered	\N	18	Consumable	Heavy-duty PVC pipes for drainage systems.	t	f	2026-05-15 15:19:36.696337	2026-05-15 15:19:36.696346	49
237	3	3	MAT-00022	Ergonomic Office Chair	48	\N	5	10	38	6500	51	Warehouse	\N	18	Non-Consumable	High-back mesh chair for office comfort.	t	f	2026-05-15 15:19:36.698168	2026-05-15 15:19:36.698177	51
238	3	3	MAT-00023	16mm TMT Bars	43	\N	2	10	33	65000	60	Open Yard	\N	18	Consumable	High-tensile strength bars for heavy load structures.	t	f	2026-05-15 15:19:36.699987	2026-05-15 15:19:36.699996	46
239	3	3	MAT-00024	Concrete Mixer 10/7 CFT	48	\N	5	2	8	145000	54	Open Yard	\N	18	Non-Consumable	Diesel-powered concrete mixer for site works.	t	f	2026-05-15 15:19:36.701806	2026-05-15 15:19:36.701815	46
240	3	3	MAT-00025	LED Tube Light 20W	46	\N	5	50	165	350	56	Warehouse	\N	18	Consumable	Energy-saving LED tube lights for office and site.	t	f	2026-05-15 15:19:36.703642	2026-05-15 15:19:36.703651	48
241	3	3	MAT-00026	OPC 53 Grade Cement	41	\N	1	100	463	450	58	Covered	\N	18	Consumable	High-strength Ordinary Portland Cement for structural concrete.	t	f	2026-05-15 15:19:36.705493	2026-05-15 15:19:36.705502	46
242	3	3	MAT-00027	Fire Extinguisher 6kg ABC	48	\N	5	15	62	3500	59	Warehouse	\N	18	Non-Consumable	Dry powder fire extinguisher for site safety.	t	f	2026-05-15 15:19:36.707301	2026-05-15 15:19:36.707311	52
243	3	3	MAT-00028	Office Workstation Desk	50	\N	5	10	36	12000	52	Warehouse	\N	18	Non-Consumable	Modular workstation for site office staff.	t	f	2026-05-15 15:19:36.709167	2026-05-15 15:19:36.709176	51
244	3	3	MAT-00029	Adhesive for Tiles 20kg	49	\N	1	100	403	550	58	Covered	\N	18	Consumable	Polymer-modified tile adhesive for long-lasting bond.	t	f	2026-05-15 15:19:36.711085	2026-05-15 15:19:36.711094	55
245	3	3	MAT-00030	Stainless Steel Hinges	48	\N	15	200	864	120	51	Warehouse	\N	18	Consumable	Rust-free SS hinges for doors and windows.	t	f	2026-05-15 15:19:36.712919	2026-05-15 15:19:36.712928	47
246	3	3	MAT-00031	2.5sqmm Copper Wire	46	\N	12	20	90	1800	56	Warehouse	\N	18	Consumable	FRLS insulated copper wire for internal wiring.	t	f	2026-05-15 15:19:36.714732	2026-05-15 15:19:36.714741	48
247	3	3	MAT-00032	Safety Helmet	48	\N	5	100	375	250	51	Warehouse	\N	18	Consumable	Industrial safety helmets with adjustable straps.	t	f	2026-05-15 15:19:36.716525	2026-05-15 15:19:36.716534	52
248	3	3	MAT-00033	Makita Hammer Drill	48	\N	5	5	17	9200	53	Warehouse	\N	18	Non-Consumable	Heavy-duty rotary hammer drill for site installation.	t	f	2026-05-15 15:19:36.718318	2026-05-15 15:19:36.718326	47
249	3	3	MAT-00034	PPC Cement	41	\N	1	150	472	420	55	Covered	\N	18	Consumable	Portland Pozzolana Cement for plastering and masonry works.	t	f	2026-05-15 15:19:36.720105	2026-05-15 15:19:36.720114	46
250	3	3	MAT-00035	Fly Ash Bricks	44	\N	5	5000	17033	8	54	Open Yard	\N	5	Consumable	Uniform sized fly ash bricks for wall construction.	t	f	2026-05-15 15:19:36.721921	2026-05-15 15:19:36.721929	54
216	3	3	MAT-00001	River Sand	42	5	3	50	176	1200	60	Open Yard		5	Consumable	Fine river sand for high-quality concrete and mortar.	t	f	2026-05-15 15:19:36.652101	2026-05-26 17:27:45.013128	54
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, tenant_id, site_id, name, code, address, phone, email, is_active, is_deleted, created_at) FROM stdin;
1	3	3	GRINFRA	ORG-00001	Bangalore			t	f	2026-05-15 12:13:00.095695
2	2	2	EASTPOINT	ORG-00001	13, JNANA PRABHA CAMPUS, BIDARAHALLI, VIRGO NAGAR POST, BANGALORE - 560049			t	f	2026-05-21 16:17:10.278201
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, tenant_id, site_id, name, code, organization_id, location, start_date, end_date, status, budget, is_active, is_deleted, created_at) FROM stdin;
2	3	3	GRInfraHyderabad	PROJ-00002	1	Hyderabad	\N	\N	Active	0	f	t	2026-05-15 12:13:57.233761
1	3	3	GRInfraBangalore	PROJ-00001	1	Bangalore	\N	\N	Active	0	t	f	2026-05-15 12:13:29.668195
3	2	2	EastPoint	PROJ-00001	2	Bangalore	\N	\N	Active	0	t	f	2026-05-21 16:17:32.015449
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_order_items (id, po_id, material_id, quantity, rate, amount, received_quantity, remarks, discount_percent, cgst_percentage, sgst_percentage, igst_percentage) FROM stdin;
429	170	218	58	622.66	36114.41	0	\N	0	0	0	0
430	170	239	91	253.69	23086.15	0	\N	0	0	0	0
431	171	232	65	798.18	51881.83	32.5	\N	0	0	0	0
432	171	240	56	696.88	39025.44	28	\N	0	0	0	0
433	172	246	84	197.82	16616.81	84	\N	0	0	0	0
434	172	238	97	253.34	24574.03	97	\N	0	0	0	0
435	173	230	62	192.3	11922.56	0	\N	0	0	0	0
436	173	243	90	994.43	89498.61	0	\N	0	0	0	0
437	173	238	71	806.76	57279.64	0	\N	0	0	0	0
438	174	224	71	334.92	23779.34	0	\N	0	0	0	0
439	174	246	56	508.97	28502.28	0	\N	0	0	0	0
440	174	242	95	439.57	41759.32	0	\N	0	0	0	0
441	175	232	74	675.81	50009.72	74	\N	0	0	0	0
442	175	246	89	634.26	56448.95	89	\N	0	0	0	0
443	176	232	85	594.08	50496.52	0	\N	0	0	0	0
444	176	247	64	701.45	44892.72	0	\N	0	0	0	0
445	176	228	83	711.34	59041.54	0	\N	0	0	0	0
446	177	218	74	647.16	47890.12	74	\N	0	0	0	0
447	177	225	91	191.78	17452.4	91	\N	0	0	0	0
448	178	233	95	935.31	88854.57	47.5	\N	0	0	0	0
449	178	234	92	432.83	39820.11	46	\N	0	0	0	0
450	178	226	68	275.36	18724.56	34	\N	0	0	0	0
451	179	241	78	264.13	20602.24	0	\N	0	0	0	0
452	179	225	69	943.86	65126.52	0	\N	0	0	0	0
453	180	233	53	539.98	28618.86	26.5	\N	0	0	0	0
454	180	239	60	532.04	31922.63	30	\N	0	0	0	0
455	181	230	97	962.72	93383.37	97	\N	0	0	0	0
456	181	223	64	229.87	14711.78	64	\N	0	0	0	0
457	181	249	83	203.57	16896.71	83	\N	0	0	0	0
458	182	224	72	549.16	39539.86	36	\N	0	0	0	0
459	182	220	97	654.04	63441.88	48.5	\N	0	0	0	0
460	182	218	50	950.36	47518.08	25	\N	0	0	0	0
461	183	225	99	184.01	18217.39	0	\N	0	0	0	0
462	183	216	86	240.24	20660.79	0	\N	0	0	0	0
463	184	246	93	501.93	46679.75	0	\N	0	0	0	0
464	184	232	54	647.48	34963.88	0	\N	0	0	0	0
465	185	249	18	420	7560	0	\N	0	0	0	0
466	185	243	40	12000	480000	0	\N	0	0	0	0
467	185	249	43	420	18060	0	\N	0	0	0	0
468	186	234	150	65	9750	0	\N	0	0	0	0
469	186	226	200	950	190000	0	\N	0	0	0	0
470	186	239	200	1450	290000	0	\N	0	0	0	0
471	186	216	200	1200	240000	0	\N	0	0	0	0
472	186	238	100	6500	650000	0	\N	0	0	0	0
473	186	224	100	6500	650000	0	\N	0	0	0	0
474	187	224	100	65000	6500000	0	\N	0	0	0	0
475	188	216	100	70.57	7057	0	\N	0	0	0	0
476	189	224	100	336.29	33629	0	\N	0	0	0	0
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, tenant_id, site_id, po_number, vendor_id, project_id, pr_id, indent_id, qr_id, po_type, total_amount, delivery_date, status, terms, created_by_id, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
172	3	3	PO-00003	54	1	\N	181	\N	Formal	41190.84	\N	Closed	\N	4	\N	\N	f	2026-04-23 18:52:30.375564	2026-05-15 18:52:30.668781
173	3	3	PO-00004	51	1	\N	182	\N	Formal	158700.81	\N	Approved	\N	4	\N	\N	f	2026-04-24 18:52:30.375564	2026-05-15 18:52:30.673538
174	3	3	PO-00005	59	1	\N	183	\N	Formal	94040.94	\N	Approved	\N	4	\N	\N	f	2026-04-25 18:52:30.375564	2026-05-15 18:52:30.677358
175	3	3	PO-00006	60	1	175	\N	\N	Formal	106458.67	\N	Closed	\N	4	\N	\N	f	2026-04-26 18:52:30.375564	2026-05-15 18:52:30.680082
176	3	3	PO-00007	56	1	176	\N	\N	Formal	154430.78	\N	Approved	\N	4	\N	\N	f	2026-04-27 18:52:30.375564	2026-05-15 18:52:30.683986
177	3	3	PO-00008	52	1	177	\N	\N	Formal	65342.52	\N	Closed	\N	4	\N	\N	f	2026-04-28 18:52:30.375564	2026-05-15 18:52:30.687165
178	3	3	PO-00009	60	1	178	\N	\N	Formal	147399.23	\N	Partially Received	\N	4	\N	\N	f	2026-04-29 18:52:30.375564	2026-05-15 18:52:30.691324
179	3	3	PO-00010	60	1	179	\N	\N	Formal	85728.76	\N	Sent to Vendor	\N	4	\N	\N	f	2026-04-30 18:52:30.375564	2026-05-15 18:52:30.694624
180	3	3	PO-00011	58	1	\N	\N	178	Formal	60541.49	\N	Partially Received	\N	4	\N	\N	f	2026-05-01 18:52:30.375564	2026-05-15 18:52:30.696708
181	3	3	PO-00012	53	1	\N	\N	179	Formal	124991.86	\N	Closed	\N	4	\N	\N	f	2026-05-02 18:52:30.375564	2026-05-15 18:52:30.700679
182	3	3	PO-00013	55	1	\N	\N	180	Formal	150499.81	\N	Partially Received	\N	4	\N	\N	f	2026-05-03 18:52:30.375564	2026-05-15 18:52:30.703739
183	3	3	PO-00014	52	1	\N	\N	181	Formal	38878.18	\N	Sent to Vendor	\N	4	\N	\N	f	2026-05-04 18:52:30.375564	2026-05-15 18:52:30.706816
170	3	3	PO-00001	54	1	\N	179	\N	Formal	59200.55	\N	Approved	\N	4	\N	\N	f	2026-04-21 18:52:30.375564	2026-05-15 18:52:30.658953
171	3	3	PO-00002	53	1	\N	180	\N	Formal	90907.27	\N	Partially Received	\N	4	\N	\N	f	2026-04-22 18:52:30.375564	2026-05-15 18:52:30.664194
184	3	3	PO-00015	52	1	\N	\N	182	Formal	81643.63	\N	Approved	\N	4	\N	\N	f	2026-05-05 18:52:30.375564	2026-05-15 18:52:30.708734
185	3	3	PO-00020	56	1	\N	188	\N	Formal	505620	\N	Draft	\N	4	\N	\N	f	2026-05-20 11:09:40.396549	2026-05-20 11:09:40.431655
186	3	3	PO-00021	51	1	185	\N	\N	Formal	2029750	2026-06-03	Approved		4	4	2026-05-20 07:11:03.64198	f	2026-05-20 12:31:17.847185	2026-05-20 12:41:03.642637
187	3	3	PO-00022	59	1	\N	195	\N	Formal	6500000	\N	Draft	\N	4	\N	\N	f	2026-05-20 12:44:10.329878	2026-05-20 12:44:10.338882
188	3	3	PO-00023	53	1	\N	\N	179	Formal	7057	\N	Draft	\N	4	\N	\N	f	2026-05-25 18:43:27.659778	2026-05-25 18:43:27.678332
189	3	3	PO-00024	54	1	\N	\N	179	Formal	33629	\N	Approved	\N	4	4	2026-05-25 13:22:18.605025	f	2026-05-25 18:43:27.751179	2026-05-25 18:52:18.60635
\.


--
-- Data for Name: purchase_request_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_request_items (id, pr_id, material_id, quantity) FROM stdin;
508	170	247	167
509	170	240	130
510	171	246	76
511	171	245	64
512	171	228	63
513	171	238	76
514	172	229	151
515	172	241	69
516	172	238	125
517	173	242	138
518	173	222	113
519	174	229	143
520	174	226	172
521	174	232	68
522	175	231	95
523	175	233	74
524	176	227	134
525	176	217	93
526	176	216	145
527	176	233	196
528	177	230	166
529	177	242	168
530	177	246	119
531	178	220	54
532	178	224	57
533	178	249	141
534	178	236	57
535	179	236	50
536	179	247	63
537	179	238	105
538	180	225	102
539	180	216	136
540	181	223	123
541	181	243	120
542	181	225	177
543	181	234	72
544	182	243	158
545	182	244	185
546	182	228	105
547	183	221	110
548	183	222	129
549	183	221	75
550	184	221	85
551	184	234	121
552	184	225	55
553	184	245	71
554	185	234	150
555	185	226	200
556	185	239	200
557	185	216	200
558	185	238	100
559	185	224	100
560	186	246	10
\.


--
-- Data for Name: purchase_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_requests (id, tenant_id, site_id, pr_number, requester_id, required_for_room_id, building_id, department_name, project_id, required_date, remarks, status, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
176	3	3	PR-00007	4	\N	2	Civil	1	2026-05-02	\N	Converted to PO	\N	\N	f	2026-04-22 18:52:30.375564	2026-05-15 18:52:30.43899
177	3	3	PR-00008	4	\N	2	Civil	1	2026-05-03	\N	Submitted	\N	\N	f	2026-04-23 18:52:30.375564	2026-05-15 18:52:30.442117
178	3	3	PR-00009	4	\N	3	Civil	1	2026-05-04	\N	Approved	\N	\N	f	2026-04-24 18:52:30.375564	2026-05-15 18:52:30.444275
179	3	3	PR-00010	4	\N	2	Civil	1	2026-05-05	\N	Approved	\N	\N	f	2026-04-25 18:52:30.375564	2026-05-15 18:52:30.448072
180	3	3	PR-00011	4	\N	3	Civil	1	2026-05-06	\N	Submitted	\N	\N	f	2026-04-26 18:52:30.375564	2026-05-15 18:52:30.449684
181	3	3	PR-00012	4	\N	2	Civil	1	2026-05-07	\N	Submitted	\N	\N	f	2026-04-27 18:52:30.375564	2026-05-15 18:52:30.452094
182	3	3	PR-00013	4	\N	1	Civil	1	2026-05-08	\N	Converted to PO	\N	\N	f	2026-04-28 18:52:30.375564	2026-05-15 18:52:30.455874
170	3	3	PR-00001	4	\N	1	Civil	1	2026-04-26	\N	Converted to PO	\N	\N	f	2026-04-16 18:52:30.375564	2026-05-15 18:52:30.416644
171	3	3	PR-00002	4	\N	3	Civil	1	2026-04-27	\N	Submitted	\N	\N	f	2026-04-17 18:52:30.375564	2026-05-15 18:52:30.421314
172	3	3	PR-00003	4	\N	1	Civil	1	2026-04-28	\N	Submitted	\N	\N	f	2026-04-18 18:52:30.375564	2026-05-15 18:52:30.426352
173	3	3	PR-00004	4	\N	2	Civil	1	2026-04-29	\N	Converted to PO	\N	\N	f	2026-04-19 18:52:30.375564	2026-05-15 18:52:30.429889
174	3	3	PR-00005	4	\N	2	Civil	1	2026-04-30	\N	Submitted	\N	\N	f	2026-04-20 18:52:30.375564	2026-05-15 18:52:30.432731
175	3	3	PR-00006	4	\N	1	Civil	1	2026-05-01	\N	Approved	\N	\N	f	2026-04-21 18:52:30.375564	2026-05-15 18:52:30.43576
183	3	3	PR-00014	4	\N	2	Civil	1	2026-05-09	\N	Submitted	\N	\N	f	2026-04-29 18:52:30.375564	2026-05-15 18:52:30.458309
184	3	3	PR-00015	4	\N	2	Civil	1	2026-05-10	\N	Converted to PO	\N	\N	f	2026-04-30 18:52:30.375564	2026-05-15 18:52:30.460726
185	3	3	PR-00020	4	\N	1	CIVIL	1	2026-06-03		Converted to PO	4	2026-05-20 06:57:55.499327	f	2026-05-20 12:27:38.929279	2026-05-20 12:31:17.850162
186	3	3	PR-00021	4	\N	1	CIVIL	1	2026-06-03		Draft	\N	\N	f	2026-05-20 14:06:53.134145	2026-05-20 14:06:53.134159
\.


--
-- Data for Name: quotation_comparisons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_comparisons (id, qr_id, qr_item_id, material_id, selected_vendor_id, auto_rank_vendor_id, is_overridden, override_reason, approved_by_id, approved_at) FROM stdin;
24	179	358	216	53	53	f	\N	\N	\N
25	179	359	224	54	54	f	\N	\N	\N
26	173	346	237	56	56	f	\N	\N	\N
27	173	347	231	56	56	f	\N	\N	\N
28	177	354	247	53	53	f	\N	\N	\N
29	177	355	236	57	57	f	\N	\N	\N
30	175	350	242	53	53	f	\N	\N	\N
31	175	351	230	59	59	f	\N	\N	\N
32	180	360	238	57	57	f	\N	\N	\N
33	180	361	237	52	52	f	\N	\N	\N
\.


--
-- Data for Name: quotation_request_item_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_request_item_sources (id, qr_item_id, source, source_pr_id, quantity) FROM stdin;
6	366	PR	179	50
7	367	PR	179	63
8	368	PR	179	105
\.


--
-- Data for Name: quotation_request_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_request_items (id, qr_id, material_id, quantity, source, source_pr_id) FROM stdin;
336	168	241	100	Manual	\N
337	168	216	100	Manual	\N
338	169	221	100	Manual	\N
339	169	218	100	Manual	\N
340	170	229	100	Manual	\N
341	170	249	100	Manual	\N
342	171	222	100	Manual	\N
343	171	250	100	Manual	\N
344	172	225	100	Manual	\N
345	172	227	100	Manual	\N
346	173	237	100	Manual	\N
347	173	231	100	Manual	\N
348	174	235	100	Manual	\N
349	174	216	100	Manual	\N
350	175	242	100	Manual	\N
351	175	230	100	Manual	\N
352	176	236	100	Manual	\N
353	176	223	100	Manual	\N
354	177	247	100	Manual	\N
355	177	236	100	Manual	\N
356	178	241	100	Manual	\N
357	178	240	100	Manual	\N
358	179	216	100	Manual	\N
359	179	224	100	Manual	\N
360	180	238	100	Manual	\N
361	180	237	100	Manual	\N
362	181	241	100	Manual	\N
363	181	221	100	Manual	\N
364	182	218	100	Manual	\N
365	182	224	100	Manual	\N
366	183	236	50	PR	179
367	183	247	63	PR	179
368	183	238	105	PR	179
\.


--
-- Data for Name: quotation_request_prs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_request_prs (id, qr_id, pr_id) FROM stdin;
4	183	179
\.


--
-- Data for Name: quotation_request_vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_request_vendors (id, qr_id, vendor_id, is_sent, sent_at, receipt_status) FROM stdin;
323	168	56	t	2026-04-19 18:52:30.375564	Received
324	168	59	t	2026-04-19 18:52:30.375564	Received
325	168	51	t	2026-04-19 18:52:30.375564	Received
326	169	54	t	2026-04-20 18:52:30.375564	Received
327	169	57	t	2026-04-20 18:52:30.375564	Received
328	169	60	t	2026-04-20 18:52:30.375564	Received
329	170	59	t	2026-04-21 18:52:30.375564	Received
330	170	54	t	2026-04-21 18:52:30.375564	Received
331	170	53	t	2026-04-21 18:52:30.375564	Received
332	171	60	t	2026-04-22 18:52:30.375564	Received
333	171	56	t	2026-04-22 18:52:30.375564	Received
334	171	53	t	2026-04-22 18:52:30.375564	Received
335	172	60	t	2026-04-23 18:52:30.375564	Received
336	172	53	t	2026-04-23 18:52:30.375564	Received
337	172	57	t	2026-04-23 18:52:30.375564	Received
338	173	60	t	2026-04-24 18:52:30.375564	Received
339	173	51	t	2026-04-24 18:52:30.375564	Received
340	173	56	t	2026-04-24 18:52:30.375564	Received
341	174	51	t	2026-04-25 18:52:30.375564	Received
342	174	52	t	2026-04-25 18:52:30.375564	Received
343	174	58	t	2026-04-25 18:52:30.375564	Received
344	175	55	t	2026-04-26 18:52:30.375564	Received
345	175	59	t	2026-04-26 18:52:30.375564	Received
346	175	53	t	2026-04-26 18:52:30.375564	Received
347	176	54	t	2026-04-27 18:52:30.375564	Received
348	176	59	t	2026-04-27 18:52:30.375564	Received
349	176	55	t	2026-04-27 18:52:30.375564	Received
350	177	60	t	2026-04-28 18:52:30.375564	Received
351	177	57	t	2026-04-28 18:52:30.375564	Received
352	177	53	t	2026-04-28 18:52:30.375564	Received
353	178	54	t	2026-04-29 18:52:30.375564	Received
354	178	53	t	2026-04-29 18:52:30.375564	Received
355	178	51	t	2026-04-29 18:52:30.375564	Received
356	179	52	t	2026-04-30 18:52:30.375564	Received
357	179	53	t	2026-04-30 18:52:30.375564	Received
358	179	54	t	2026-04-30 18:52:30.375564	Received
359	180	52	t	2026-05-01 18:52:30.375564	Received
360	180	57	t	2026-05-01 18:52:30.375564	Received
361	180	58	t	2026-05-01 18:52:30.375564	Received
362	181	57	t	2026-05-02 18:52:30.375564	Received
363	181	55	t	2026-05-02 18:52:30.375564	Received
364	181	59	t	2026-05-02 18:52:30.375564	Received
365	182	60	t	2026-05-03 18:52:30.375564	Received
366	182	56	t	2026-05-03 18:52:30.375564	Received
367	182	53	t	2026-05-03 18:52:30.375564	Received
368	183	59	f	\N	Pending
369	183	60	f	\N	Pending
370	183	55	f	\N	Pending
\.


--
-- Data for Name: quotation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_requests (id, tenant_id, site_id, qr_number, project_id, created_by_id, required_date, remarks, status, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
183	3	3	QR-00018	1	4	2026-05-27	\N	Draft	\N	\N	f	2026-05-20 14:07:32.990262	2026-05-20 14:07:32.990275
179	3	3	QR-00012	1	4	\N	\N	Ordered	\N	\N	f	2026-04-29 18:52:30.375564	2026-05-25 18:43:27.75731
168	3	3	QR-00001	1	4	\N	\N	Received	\N	\N	f	2026-04-18 18:52:30.375564	2026-05-15 18:52:30.473134
169	3	3	QR-00002	1	4	\N	\N	Approved	\N	\N	f	2026-04-19 18:52:30.375564	2026-05-15 18:52:30.489799
170	3	3	QR-00003	1	4	\N	\N	Compared	\N	\N	f	2026-04-20 18:52:30.375564	2026-05-15 18:52:30.501487
171	3	3	QR-00004	1	4	\N	\N	Compared	\N	\N	f	2026-04-21 18:52:30.375564	2026-05-15 18:52:30.512816
172	3	3	QR-00005	1	4	\N	\N	Received	\N	\N	f	2026-04-22 18:52:30.375564	2026-05-15 18:52:30.52254
173	3	3	QR-00006	1	4	\N	\N	Approved	\N	\N	f	2026-04-23 18:52:30.375564	2026-05-15 18:52:30.531489
174	3	3	QR-00007	1	4	\N	\N	Received	\N	\N	f	2026-04-24 18:52:30.375564	2026-05-15 18:52:30.541676
175	3	3	QR-00008	1	4	\N	\N	Approved	\N	\N	f	2026-04-25 18:52:30.375564	2026-05-15 18:52:30.552259
176	3	3	QR-00009	1	4	\N	\N	Compared	\N	\N	f	2026-04-26 18:52:30.375564	2026-05-15 18:52:30.562053
177	3	3	QR-00010	1	4	\N	\N	Approved	\N	\N	f	2026-04-27 18:52:30.375564	2026-05-15 18:52:30.571349
178	3	3	QR-00011	1	4	\N	\N	Compared	\N	\N	f	2026-04-28 18:52:30.375564	2026-05-15 18:52:30.579722
180	3	3	QR-00013	1	4	\N	\N	Received	\N	\N	f	2026-04-30 18:52:30.375564	2026-05-15 18:52:30.596713
181	3	3	QR-00014	1	4	\N	\N	Received	\N	\N	f	2026-05-01 18:52:30.375564	2026-05-15 18:52:30.605366
182	3	3	QR-00015	1	4	\N	\N	Compared	\N	\N	f	2026-05-02 18:52:30.375564	2026-05-15 18:52:30.613049
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, resource, can_read, can_create, can_update, can_delete, extended_actions) FROM stdin;
86	3	dashboard	t	f	f	f	{}
87	3	materials	t	t	t	t	{}
88	3	categories	t	t	t	t	{}
89	3	vendors	t	t	t	t	{}
90	3	warehouses	t	t	t	t	{}
91	3	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
92	3	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
93	3	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
94	3	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
95	3	gate_entry	t	t	t	t	{}
96	3	invoice	t	t	t	t	{}
97	3	grn	t	t	t	t	{}
98	3	issues	t	t	t	t	{}
99	3	acknowledgements	t	t	t	t	{}
100	3	inventory	t	t	t	t	{}
101	3	intelligence	t	f	f	f	{}
102	3	reports	t	f	f	f	{}
103	3	admin_users	t	t	t	t	{}
104	3	admin_roles	t	t	t	t	{}
105	3	approval_flows	t	t	t	t	{}
106	3	projects	t	t	t	t	{}
107	3	organizations	t	t	t	t	{}
108	3	departments	t	t	t	t	{}
109	3	terms	t	t	t	t	{}
110	8	dashboard	t	f	f	f	{}
111	8	materials	t	t	t	t	{}
112	8	categories	t	t	t	t	{}
113	8	vendors	t	t	t	t	{}
114	8	warehouses	t	t	t	t	{}
115	8	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
116	8	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
117	8	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
118	8	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
119	8	gate_entry	t	t	t	t	{}
120	8	invoice	t	t	t	t	{}
121	8	grn	t	t	t	t	{}
122	8	issues	t	t	t	t	{}
123	8	acknowledgements	t	t	t	t	{}
124	8	inventory	t	t	t	t	{}
125	8	intelligence	t	f	f	f	{}
126	8	reports	t	f	f	f	{}
127	8	admin_users	t	t	t	t	{}
128	8	admin_roles	t	t	t	t	{}
129	8	approval_flows	t	t	t	t	{}
130	8	projects	t	t	t	t	{}
131	8	organizations	t	t	t	t	{}
132	8	departments	t	t	t	t	{}
133	8	terms	t	t	t	t	{}
134	4	dashboard	t	f	f	f	{}
135	4	materials	t	t	t	t	{}
136	4	categories	t	t	t	t	{}
137	4	vendors	t	t	t	t	{}
138	4	warehouses	t	t	t	t	{}
139	4	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
140	4	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
141	4	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
142	4	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
143	4	gate_entry	t	t	t	t	{}
144	4	invoice	t	t	t	t	{}
145	4	grn	t	t	t	t	{}
146	4	issues	t	t	t	t	{}
147	4	acknowledgements	t	t	t	t	{}
148	4	inventory	t	t	t	t	{}
149	4	intelligence	t	f	f	f	{}
150	4	reports	t	f	f	f	{}
151	4	admin_users	t	t	t	t	{}
152	4	admin_roles	t	t	t	t	{}
153	4	approval_flows	t	t	t	t	{}
154	4	projects	t	t	t	t	{}
155	4	organizations	t	t	t	t	{}
156	4	departments	t	t	t	t	{}
157	4	terms	t	t	t	t	{}
158	6	dashboard	t	f	f	f	{}
159	6	materials	t	t	t	t	{}
160	6	categories	t	t	t	t	{}
161	6	vendors	t	t	t	t	{}
162	6	warehouses	t	t	t	t	{}
163	6	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
164	6	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
165	6	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
166	6	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
167	6	gate_entry	t	t	t	t	{}
168	6	invoice	t	t	t	t	{}
169	6	grn	t	t	t	t	{}
170	6	issues	t	t	t	t	{}
171	6	acknowledgements	t	t	t	t	{}
172	6	inventory	t	t	t	t	{}
173	6	intelligence	t	f	f	f	{}
174	6	reports	t	f	f	f	{}
175	6	admin_users	t	t	t	t	{}
176	6	admin_roles	t	t	t	t	{}
177	6	approval_flows	t	t	t	t	{}
178	6	projects	t	t	t	t	{}
179	6	organizations	t	t	t	t	{}
180	6	departments	t	t	t	t	{}
181	6	terms	t	t	t	t	{}
182	5	dashboard	t	f	f	f	{}
183	5	materials	t	t	t	t	{}
184	5	categories	t	t	t	t	{}
185	5	vendors	t	t	t	t	{}
186	5	warehouses	t	t	t	t	{}
187	5	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
188	5	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
189	5	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
190	5	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
191	5	gate_entry	t	t	t	t	{}
192	5	invoice	t	t	t	t	{}
193	5	grn	t	t	t	t	{}
194	5	issues	t	t	t	t	{}
195	5	acknowledgements	t	t	t	t	{}
196	5	inventory	t	t	t	t	{}
197	5	intelligence	t	f	f	f	{}
198	5	reports	t	f	f	f	{}
199	5	admin_users	t	t	t	t	{}
200	5	admin_roles	t	t	t	t	{}
201	5	approval_flows	t	t	t	t	{}
202	5	projects	t	t	t	t	{}
203	5	organizations	t	t	t	t	{}
204	5	departments	t	t	t	t	{}
205	5	terms	t	t	t	t	{}
206	7	dashboard	t	f	f	f	{}
207	7	materials	t	t	t	t	{}
208	7	categories	t	t	t	t	{}
209	7	vendors	t	t	t	t	{}
210	7	warehouses	t	t	t	t	{}
211	7	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
212	7	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
213	7	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
214	7	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
215	7	gate_entry	t	t	t	t	{}
216	7	invoice	t	t	t	t	{}
217	7	grn	t	t	t	t	{}
218	7	issues	t	t	t	t	{}
219	7	acknowledgements	t	t	t	t	{}
220	7	inventory	t	t	t	t	{}
221	7	intelligence	t	f	f	f	{}
222	7	reports	t	f	f	f	{}
223	7	admin_users	t	t	t	t	{}
224	7	admin_roles	t	t	t	t	{}
225	7	approval_flows	t	t	t	t	{}
226	7	projects	t	t	t	t	{}
227	7	organizations	t	t	t	t	{}
228	7	departments	t	t	t	t	{}
229	7	terms	t	t	t	t	{}
230	9	dashboard	t	f	f	f	{}
231	9	materials	t	t	t	t	{}
232	9	categories	t	t	t	t	{}
233	9	vendors	t	t	t	t	{}
234	9	warehouses	t	t	t	t	{}
235	9	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
236	9	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
237	9	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
238	9	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
239	9	gate_entry	t	t	t	t	{}
240	9	invoice	t	t	t	t	{}
241	9	grn	t	t	t	t	{}
242	9	issues	t	t	t	t	{}
243	9	acknowledgements	t	t	t	t	{}
244	9	inventory	t	t	t	t	{}
245	9	intelligence	t	f	f	f	{}
246	9	reports	t	f	f	f	{}
247	9	admin_users	t	t	t	t	{}
248	9	admin_roles	t	t	t	t	{}
249	9	approval_flows	t	t	t	t	{}
250	9	projects	t	t	t	t	{}
251	9	organizations	t	t	t	t	{}
252	9	departments	t	t	t	t	{}
253	9	terms	t	t	t	t	{}
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, tenant_id, name, code, description, is_system, created_at) FROM stdin;
6	3	Indenter	INDENTER	the person request for the materials required	f	2026-05-27 15:35:43.041222
3	3	Store Admin	STOREADMIN	Full tenant access	f	2026-05-15 12:07:06.801413
7	3	Department Head	DEPARTMENTHEAD	Look after their department	f	2026-05-27 15:36:15.454248
8	3	CEO	CEO	Chief Executive Officer	f	2026-05-27 15:36:36.10235
9	3	Gate Keeper	GATEKEEPER	Incharge of material IN/OUT	f	2026-05-27 15:42:33.453327
4	3	Store Manager	STOREMANAGER	The person responsible for all the store management and workers management	f	2026-05-27 15:28:37.187928
5	3	Store keeper	STOREKEEPER	the person takes care of material in store	f	2026-05-27 15:34:40.519209
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, tenant_id, site_id, name, code, department_name, floor_id, is_active, is_deleted, created_at) FROM stdin;
2	3	3	Room1	RM-00002	CIVIL	2	t	f	2026-05-15 13:20:49.544108
1	3	3	Room1	RM-00001	CIVIL	1	t	f	2026-05-15 12:40:07.999107
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sites (id, tenant_id, name, code, location, is_active, created_at) FROM stdin;
1	1	ngtest	\N	Bangalore	t	2026-05-15 10:39:02.424044
2	2	EastPoint	\N	Bangalore	t	2026-05-15 10:52:51.728611
3	3	GRInfra	\N	Bangalore	t	2026-05-15 12:07:06.799501
\.


--
-- Data for Name: stock_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_ledger (id, tenant_id, site_id, material_id, warehouse_id, transaction_type, quantity, balance, reference_type, reference_id, reference_number, project_id, room_id, remarks, created_by_id, created_at) FROM stdin;
818	3	3	218	58	GRN	58	58	GRN	167	GRN-00001	1	\N	\N	4	2026-05-15 18:52:30.7739
819	3	3	239	58	GRN	91	183	GRN	167	GRN-00001	1	\N	\N	4	2026-05-15 18:52:30.778512
820	3	3	232	54	GRN	65	65	GRN	168	GRN-00002	1	\N	\N	4	2026-05-15 18:52:30.783608
821	3	3	240	54	GRN	56	56	GRN	168	GRN-00002	1	\N	\N	4	2026-05-15 18:52:30.787735
822	3	3	246	59	GRN	84	84	GRN	169	GRN-00003	1	\N	\N	4	2026-05-15 18:52:30.792942
823	3	3	238	59	GRN	97	97	GRN	169	GRN-00003	1	\N	\N	4	2026-05-15 18:52:30.796673
824	3	3	230	53	GRN	62	62	GRN	170	GRN-00004	1	\N	\N	4	2026-05-15 18:52:30.801702
825	3	3	243	53	GRN	90	90	GRN	170	GRN-00004	1	\N	\N	4	2026-05-15 18:52:30.804463
826	3	3	238	53	GRN	71	130	GRN	170	GRN-00004	1	\N	\N	4	2026-05-15 18:52:30.808569
827	3	3	224	51	GRN	71	71	GRN	171	GRN-00005	1	\N	\N	4	2026-05-15 18:52:30.813547
828	3	3	246	51	GRN	56	56	GRN	171	GRN-00005	1	\N	\N	4	2026-05-15 18:52:30.815871
829	3	3	242	51	GRN	95	95	GRN	171	GRN-00005	1	\N	\N	4	2026-05-15 18:52:30.819544
830	3	3	232	48	GRN	74	118.5	GRN	172	GRN-00006	1	\N	\N	4	2026-05-15 18:52:30.824516
831	3	3	246	48	GRN	89	99	GRN	172	GRN-00006	1	\N	\N	4	2026-05-15 18:52:30.827433
832	3	3	232	54	GRN	85	150	GRN	173	GRN-00007	1	\N	\N	4	2026-05-15 18:52:30.831705
833	3	3	247	54	GRN	64	158	GRN	173	GRN-00007	1	\N	\N	4	2026-05-15 18:52:30.833876
834	3	3	228	54	GRN	83	182	GRN	173	GRN-00007	1	\N	\N	4	2026-05-15 18:52:30.83689
835	3	3	218	59	GRN	74	74	GRN	174	GRN-00008	1	\N	\N	4	2026-05-15 18:52:30.841674
836	3	3	225	59	GRN	91	91	GRN	174	GRN-00008	1	\N	\N	4	2026-05-15 18:52:30.845113
837	3	3	233	60	GRN	95	166.5	GRN	175	GRN-00009	1	\N	\N	4	2026-05-15 18:52:30.849446
838	3	3	234	60	GRN	92	92	GRN	175	GRN-00009	1	\N	\N	4	2026-05-15 18:52:30.85166
839	3	3	226	60	GRN	68	68	GRN	175	GRN-00009	1	\N	\N	4	2026-05-15 18:52:30.854537
840	3	3	241	54	GRN	78	78	GRN	176	GRN-00010	1	\N	\N	4	2026-05-15 18:52:30.859075
841	3	3	225	54	GRN	69	69	GRN	176	GRN-00010	1	\N	\N	4	2026-05-15 18:52:30.862468
842	3	3	233	55	GRN	26.5	217	GRN	177	GRN-00011	1	\N	\N	4	2026-05-15 18:52:30.866763
843	3	3	239	55	GRN	30	65	GRN	177	GRN-00011	1	\N	\N	4	2026-05-15 18:52:30.869811
844	3	3	230	58	GRN	48.5	48.5	GRN	178	GRN-00012	1	\N	\N	4	2026-05-15 18:52:30.874545
845	3	3	223	58	GRN	32	62	GRN	178	GRN-00012	1	\N	\N	4	2026-05-15 18:52:30.876786
846	3	3	249	58	GRN	41.5	41.5	GRN	178	GRN-00012	1	\N	\N	4	2026-05-15 18:52:30.879577
847	3	3	224	48	GRN	36	161	GRN	179	GRN-00013	1	\N	\N	4	2026-05-15 18:52:30.883845
848	3	3	220	48	GRN	48.5	48.5	GRN	179	GRN-00013	1	\N	\N	4	2026-05-15 18:52:30.886286
849	3	3	218	48	GRN	25	25	GRN	179	GRN-00013	1	\N	\N	4	2026-05-15 18:52:30.890106
850	3	3	225	47	GRN	49.5	49.5	GRN	180	GRN-00014	1	\N	\N	4	2026-05-15 18:52:30.894827
851	3	3	216	47	GRN	43	43	GRN	180	GRN-00014	1	\N	\N	4	2026-05-15 18:52:30.898183
852	3	3	246	46	GRN	46.5	46.5	GRN	181	GRN-00015	1	\N	\N	4	2026-05-15 18:52:30.902895
853	3	3	232	46	GRN	27	77	GRN	181	GRN-00015	1	\N	\N	4	2026-05-15 18:52:30.904207
854	3	3	241	54	Issue	-2	76	Material Issue	190	ISS-00001	1	\N	\N	4	2026-05-15 18:52:30.990329
855	3	3	243	52	Issue	-4	80	Material Issue	191	ISS-00002	1	\N	\N	4	2026-05-15 18:52:30.995288
856	3	3	220	52	Issue	-1	160	Material Issue	192	ISS-00003	1	\N	\N	4	2026-05-15 18:52:30.999433
857	3	3	236	49	Issue	-1	204	Material Issue	193	ISS-00004	1	\N	\N	4	2026-05-15 18:52:31.004345
858	3	3	246	46	Issue	-4	42.5	Material Issue	194	ISS-00005	1	\N	\N	4	2026-05-15 18:52:31.009658
859	3	3	232	59	Issue	-2	82	Material Issue	195	ISS-00006	1	\N	\N	4	2026-05-15 18:52:31.014116
860	3	3	217	46	Issue	-5	112	Material Issue	196	ISS-00007	1	\N	\N	4	2026-05-15 18:52:31.01855
861	3	3	216	57	Issue	-2	60.5	Material Issue	197	ISS-00008	1	\N	\N	4	2026-05-15 18:52:31.022347
862	3	3	241	46	Issue	-3	66	Material Issue	198	ISS-00009	1	\N	\N	4	2026-05-15 18:52:31.026075
863	3	3	224	46	Issue	-5	5	Material Issue	199	ISS-00010	1	\N	\N	4	2026-05-15 18:52:31.029522
864	3	3	232	46	Issue	-4	73	Material Issue	200	ISS-00011	1	\N	\N	4	2026-05-15 18:52:31.032918
865	3	3	248	52	Issue	-2	53	Material Issue	201	ISS-00012	1	\N	\N	4	2026-05-15 18:52:31.0365
866	3	3	229	46	Issue	-3	71	Material Issue	202	ISS-00013	1	\N	\N	4	2026-05-15 18:52:31.041066
867	3	3	216	47	Issue	-1	42	Material Issue	203	ISS-00014	1	\N	\N	4	2026-05-15 18:52:31.045559
868	3	3	245	53	Issue	-4	55	Material Issue	204	ISS-00015	1	\N	\N	4	2026-05-15 18:52:31.048955
869	3	3	228	55	Issue	-15	3395	Issue	205	ISS-00020	1	1	\N	4	2026-05-20 11:11:02.727156
870	3	3	242	52	Issue	-19	98	Issue	206	ISS-00021	1	1	\N	4	2026-05-20 11:11:02.775686
876	3	3	222	59	Return	10	78	Return	11	RET-00004	1	\N	\N	4	2026-05-20 12:52:59.888911
877	3	3	230	59	Return	1	1	Return	12	RET-00005	1	\N	\N	4	2026-05-20 12:53:43.088956
879	3	3	224	46	Issue	-5	0	Issue	207	ISS-00022	1	2	\N	4	2026-05-26 17:33:32.468342
871	3	3	244	56	Return	2	2	Return	6	RET-00001	1	\N	\N	4	2026-05-20 12:47:03.3244
872	3	3	244	56	Outward Repair	-2	0	GatePass	1	GP-00001	1	\N	\N	4	2026-05-20 12:47:03.329841
878	3	3	230	61	Return	1	1	Return	15	RET-00006	1	\N	\N	4	2026-05-20 12:59:53.321192
880	3	3	238	46	Issue	-21	46	Issue	208	ISS-00023	1	2	\N	4	2026-05-26 18:18:05.529931
413	3	3	216	54	Adjustment	115	115	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.656414
414	3	3	217	46	Adjustment	117	117	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.659424
415	3	3	218	46	Adjustment	1018	1018	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.66187
416	3	3	219	54	Adjustment	303	303	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.664113
417	3	3	220	47	Adjustment	85	85	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.666343
418	3	3	221	52	Adjustment	122	122	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.668588
419	3	3	222	47	Adjustment	113	113	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.67061
420	3	3	223	47	Adjustment	97	97	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.672472
421	3	3	224	46	Adjustment	15	15	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.674591
422	3	3	225	50	Adjustment	41	41	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.676719
423	3	3	226	54	Adjustment	143	143	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.678743
424	3	3	227	46	Adjustment	4	4	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.680658
425	3	3	228	55	Adjustment	3215	3215	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.682552
426	3	3	229	46	Adjustment	79	79	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.684473
427	3	3	230	47	Adjustment	9	9	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.686427
428	3	3	231	47	Adjustment	246	246	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.688452
429	3	3	232	50	Adjustment	52	52	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.690476
873	3	3	230	56	Return	2	2	Return	9	RET-00002	1	\N	\N	4	2026-05-20 12:50:39.836653
874	3	3	230	56	Outward Repair	-2	0	GatePass	2	GP-00002	1	\N	\N	4	2026-05-20 12:50:39.840395
881	3	3	225	50	Issue	-25	11	Issue	209	ISS-00024	1	2	\N	4	2026-05-26 18:19:24.675906
875	3	3	246	59	Return	1	85	Return	10	RET-00003	1	\N	\N	4	2026-05-20 12:51:33.816814
882	3	3	232	50	Issue	-40	8	Issue	210	ISS-00025	1	1	\N	4	2026-05-26 18:25:34.29287
430	3	3	233	54	Adjustment	25	25	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.692927
431	3	3	234	54	Adjustment	3943	3943	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.695275
432	3	3	235	49	Adjustment	13	13	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.697182
433	3	3	236	49	Adjustment	210	210	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.699005
434	3	3	237	51	Adjustment	14	14	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.700821
435	3	3	238	46	Adjustment	26	26	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.702654
436	3	3	239	46	Adjustment	7	7	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.70451
437	3	3	240	48	Adjustment	81	81	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.706333
438	3	3	241	46	Adjustment	131	131	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.708176
439	3	3	242	52	Adjustment	14	14	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.71003
440	3	3	243	51	Adjustment	6	6	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.711927
441	3	3	244	55	Adjustment	52	52	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.713745
442	3	3	245	47	Adjustment	168	168	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.715556
443	3	3	246	48	Adjustment	15	15	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.717361
444	3	3	247	52	Adjustment	31	31	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.719175
445	3	3	248	47	Adjustment	3	3	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.720958
446	3	3	249	46	Adjustment	125	125	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.722767
447	3	3	250	54	Adjustment	2932	2932	Opening Balance	\N	OB-001	\N	\N	Initial seed stock	4	2026-05-15 15:19:36.724004
\.


--
-- Data for Name: stock_transfer_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_transfer_items (id, transfer_id, material_id, quantity, remarks) FROM stdin;
\.


--
-- Data for Name: stock_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_transfers (id, tenant_id, site_id, transfer_number, from_warehouse_id, to_warehouse_id, project_id, status, remarks, created_by_id, is_deleted, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subcategories (id, tenant_id, site_id, name, category_id, is_active, is_deleted) FROM stdin;
1	3	3	OPC 43 Grade	41	t	f
2	3	3	OPC 53 Grade	41	t	f
3	3	3	PPC	41	t	f
4	3	3	BB1	44	t	f
5	3	3	Sand & Aggregates General	42	t	f
6	3	3	Steel & Reinforcement General	43	t	f
7	3	3	Plumbing & Sanitary General	45	t	f
8	3	3	Electricals General	46	t	f
9	3	3	Paints & Finishes General	47	t	f
10	3	3	Hardware & Tools General	48	t	f
11	3	3	Flooring & Tiling General	49	t	f
12	3	3	Wood & Timber General	50	t	f
\.


--
-- Data for Name: tenant_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_memberships (id, user_id, tenant_id, is_active, joined_at) FROM stdin;
1	2	1	t	2026-05-15 10:39:02.650241
2	3	2	t	2026-05-15 10:52:51.953477
3	4	3	t	2026-05-15 12:07:07.025764
4	5	3	t	2026-05-27 16:17:53.086315
5	6	3	t	2026-05-27 16:48:52.328511
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, slug, status, subscription_plan, max_sites, created_at) FROM stdin;
1	NGTest	ngtest	Active	single_site	1	2026-05-15 10:39:02.422395
2	EastPoint	eastpoint	Active	single_site	1	2026-05-15 10:52:51.727748
3	GRInfra	grinfra	Active	multi_site	5	2026-05-15 12:07:06.797979
\.


--
-- Data for Name: terms_and_conditions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.terms_and_conditions (id, tenant_id, site_id, name, content, is_default, is_active, created_at) FROM stdin;
1	3	3	EastPoint	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	t	t	2026-05-20 13:57:40.831501
\.


--
-- Data for Name: uom; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uom (id, tenant_id, site_id, name, abbreviation, is_active, is_deleted) FROM stdin;
1	3	3	Bags	BAG	t	f
2	3	3	Metric Ton	MT	t	f
3	3	3	Cubic Meter	CUM	t	f
4	3	3	Cubic Foot	CFT	t	f
5	3	3	Numbers	NOS	t	f
6	3	3	Kilograms	KG	t	f
7	3	3	Liters	LTR	t	f
8	3	3	Running Meter	RMT	t	f
9	3	3	Square Meter	SQM	t	f
10	3	3	Square Foot	SQFT	t	f
11	3	3	Bundles	BDL	t	f
12	3	3	Rolls	ROL	t	f
13	3	3	Sets	SET	t	f
14	3	3	Boxes	BOX	t	f
15	3	3	Pairs	PR	t	f
16	3	3	Kilometers	KM	t	f
17	3	3	Grams	GM	t	f
18	3	3	Millimeters	MM	t	f
19	3	3	Inches	INC	t	f
20	3	3	Feet	FT	t	f
\.


--
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_role_assignments (id, user_id, tenant_id, role_id, site_id, assigned_at) FROM stdin;
5	4	3	3	3	2026-05-27 16:46:28.610806
6	5	3	4	\N	2026-05-27 16:46:39.303002
7	6	3	8	\N	2026-05-27 16:48:52.329507
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, full_name, hashed_password, is_active, is_platform_admin, is_deleted, created_at, updated_at) FROM stdin;
1	superadmin	super@nissigrid.com	Super Admin	$2b$12$kblQdcUjLM0OowBwpbo95.xFkdM32Nkb9QR0DBGPxXNddxi/Blswe	t	t	f	2026-05-15 10:36:51.375798	2026-05-15 10:36:51.375812
2	admin	ilangkumaran@nissigrid.com	NG Admin	$2b$12$wGARVt2laadI2WThEO/ab.gugi7F4bDF.hZUUMbgE/CH.yUBBaBDK	t	f	f	2026-05-15 10:39:02.648701	2026-05-15 10:39:02.648715
3	epadmin	ilangkumaran@yahoo.com	EastPoint Admin	$2b$12$jaHYZkPTGafulxVl1YbFqOteTo17KPzpCDcv9XA3X4643BF7pClA2	t	f	f	2026-05-15 10:52:51.952583	2026-05-15 10:52:51.952596
4	gradmin	fredrick.antony@nissigrid.com	Fredrick	$2b$12$RJHB/899Hdxu4eeh6V6cY.CKNcYsU0MVfG01xYcBkxgkRrycHibjS	t	f	f	2026-05-15 12:07:07.024311	2026-05-27 16:46:28.609001
5	grmanager	samson@grinfra.com	Samson	$2b$12$QIdDgbUmgqkQjOwwQIW2AerreYcirZEmPgdyT.QK.S97Ig2C6IG6q	t	f	f	2026-05-27 16:17:53.070455	2026-05-27 16:46:39.301217
6	grceo	kumar@nissigrid.com	kumar	$2b$12$cQZpPfQTuq0uThZ5/DQfYOzN7ny5J78vH685hazc4Glxwt3KNV.62	t	f	f	2026-05-27 16:48:52.327279	2026-05-27 16:48:52.327291
\.


--
-- Data for Name: vendor_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_categories (id, vendor_id, category_id) FROM stdin;
41	51	41
42	52	43
43	53	41
44	54	47
45	55	49
46	56	45
47	57	46
48	58	45
49	59	41
50	60	43
\.


--
-- Data for Name: vendor_quotation_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_quotation_items (id, vendor_quotation_id, qr_item_id, material_id, quoted_rate, delivery_days, is_excluded, remarks) FROM stdin;
994	497	336	241	492.74	3	f	\N
995	497	337	216	383.89	4	f	\N
996	498	336	241	157.7	14	f	\N
997	498	337	216	306.28	1	f	\N
998	499	336	241	405.44	10	f	\N
999	499	337	216	464.46	6	f	\N
1000	500	338	221	389.05	12	f	\N
1001	500	339	218	414.08	8	f	\N
1002	501	338	221	289.72	2	f	\N
1003	501	339	218	67.22	14	f	\N
1004	502	338	221	103.23	5	f	\N
1005	502	339	218	17.42	1	f	\N
1006	503	340	229	151.68	6	f	\N
1007	503	341	249	259.38	7	f	\N
1008	504	340	229	26.46	14	f	\N
1009	504	341	249	491.98	14	f	\N
1010	505	340	229	149.14	13	f	\N
1011	505	341	249	100.53	9	f	\N
1012	506	342	222	163.41	7	f	\N
1013	506	343	250	384.96	3	f	\N
1014	507	342	222	160.88	2	f	\N
1015	507	343	250	265.91	6	f	\N
1016	508	342	222	477.86	8	f	\N
1017	508	343	250	63.13	10	f	\N
1018	509	344	225	220.64	8	f	\N
1019	509	345	227	45.12	4	f	\N
1020	510	344	225	284.91	9	f	\N
1021	510	345	227	499.02	15	f	\N
1022	511	344	225	317.64	1	f	\N
1023	511	345	227	266.9	11	f	\N
1024	512	346	237	474.55	7	f	\N
1025	512	347	231	457.87	8	f	\N
1026	513	346	237	288.46	9	f	\N
1027	513	347	231	188.58	5	f	\N
1028	514	346	237	150.32	13	f	\N
1029	514	347	231	92.1	1	f	\N
1030	515	348	235	243.32	9	f	\N
1031	515	349	216	293.85	12	f	\N
1032	516	348	235	35.87	6	f	\N
1033	516	349	216	202.78	12	f	\N
1034	517	348	235	233.27	8	f	\N
1035	517	349	216	418.48	11	f	\N
1036	518	350	242	371.23	9	f	\N
1037	518	351	230	306.85	6	f	\N
1038	519	350	242	207.68	8	f	\N
1039	519	351	230	20.42	6	f	\N
1040	520	350	242	204.38	12	f	\N
1041	520	351	230	55	6	f	\N
1042	521	352	236	75.13	15	f	\N
1043	521	353	223	334.16	11	f	\N
1044	522	352	236	151.78	11	f	\N
1045	522	353	223	424.18	2	f	\N
1046	523	352	236	395.11	12	f	\N
1047	523	353	223	133.14	12	f	\N
1048	524	354	247	64.7	13	f	\N
1049	524	355	236	175.05	2	f	\N
1050	525	354	247	103.14	6	f	\N
1051	525	355	236	84.41	10	f	\N
1052	526	354	247	54.85	8	f	\N
1053	526	355	236	89.06	8	f	\N
1054	527	356	241	405.21	9	f	\N
1055	527	357	240	117.8	14	f	\N
1056	528	356	241	271.17	15	f	\N
1057	528	357	240	180.6	7	f	\N
1058	529	356	241	457.47	15	f	\N
1059	529	357	240	385.62	7	f	\N
1060	530	358	216	347.95	1	f	\N
1061	530	359	224	340.31	1	f	\N
1062	531	358	216	70.57	8	f	\N
1063	531	359	224	474.85	5	f	\N
1064	532	358	216	155.78	10	f	\N
1065	532	359	224	336.29	14	f	\N
1066	533	360	238	462.31	3	f	\N
1067	533	361	237	26.17	15	f	\N
1068	534	360	238	36.88	14	f	\N
1069	534	361	237	85.12	10	f	\N
1070	535	360	238	398.46	2	f	\N
1071	535	361	237	74.36	13	f	\N
1072	536	362	241	465.77	9	f	\N
1073	536	363	221	256.63	15	f	\N
1074	537	362	241	78.37	11	f	\N
1075	537	363	221	319.23	13	f	\N
1076	538	362	241	38.86	8	f	\N
1077	538	363	221	304.28	10	f	\N
1078	539	364	218	372.29	10	f	\N
1079	539	365	224	305.19	7	f	\N
1080	540	364	218	159.6	15	f	\N
1081	540	365	224	389.44	11	f	\N
1082	541	364	218	472.96	12	f	\N
1083	541	365	224	268.9	5	f	\N
\.


--
-- Data for Name: vendor_quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_quotations (id, qr_id, vendor_id, quotation_number, quotation_date, received_date, attachment_path, remarks, status, entered_by_id, created_at) FROM stdin;
497	168	56	QTN-VEN-0006-1	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.480951
498	168	59	QTN-VEN-0009-1	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.485503
499	168	51	QTN-VEN-0001-1	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.488824
500	169	54	QTN-VEN-0004-2	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.495001
501	169	57	QTN-VEN-0007-2	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.497629
502	169	60	QTN-VEN-0010-2	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.500483
503	170	59	QTN-VEN-0009-3	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.506816
504	170	54	QTN-VEN-0004-3	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.509053
505	170	53	QTN-VEN-0003-3	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.511915
506	171	60	QTN-VEN-0010-4	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.517318
507	171	56	QTN-VEN-0006-4	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.519376
508	171	53	QTN-VEN-0003-4	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.521674
509	172	60	QTN-VEN-0010-5	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.526857
510	172	53	QTN-VEN-0003-5	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.528773
511	172	57	QTN-VEN-0007-5	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.530666
512	173	60	QTN-VEN-0010-6	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.536153
513	173	51	QTN-VEN-0001-6	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.5386
514	173	56	QTN-VEN-0006-6	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.54083
515	174	51	QTN-VEN-0001-7	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.545971
516	174	52	QTN-VEN-0002-7	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.548622
517	174	58	QTN-VEN-0008-7	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.551371
518	175	55	QTN-VEN-0005-8	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.557293
519	175	59	QTN-VEN-0009-8	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.559238
520	175	53	QTN-VEN-0003-8	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.561204
521	176	54	QTN-VEN-0004-9	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.566301
522	176	59	QTN-VEN-0009-9	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.568297
523	176	55	QTN-VEN-0005-9	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.570472
524	177	60	QTN-VEN-0010-10	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.575109
525	177	57	QTN-VEN-0007-10	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.577005
526	177	53	QTN-VEN-0003-10	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.578915
527	178	54	QTN-VEN-0004-11	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.583354
528	178	53	QTN-VEN-0003-11	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.585333
529	178	51	QTN-VEN-0001-11	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.587462
530	179	52	QTN-VEN-0002-12	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.592135
531	179	53	QTN-VEN-0003-12	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.594015
532	179	54	QTN-VEN-0004-12	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.595886
533	180	52	QTN-VEN-0002-13	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.600365
534	180	57	QTN-VEN-0007-13	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.602411
535	180	58	QTN-VEN-0008-13	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.604523
536	181	57	QTN-VEN-0007-14	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.608412
537	181	55	QTN-VEN-0005-14	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.610329
538	181	59	QTN-VEN-0009-14	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.612249
539	182	60	QTN-VEN-0010-15	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.616018
540	182	56	QTN-VEN-0006-15	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.618017
541	182	53	QTN-VEN-0003-15	\N	\N	\N	\N	Received	4	2026-05-15 18:52:30.620059
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, tenant_id, site_id, name, code, contact_person, phone, email, gst_number, pan_number, address, city, state, pincode, bank_name, bank_account, ifsc_code, rating, is_active, is_deleted, created_at, updated_at) FROM stdin;
51	3	3	UltraTech Cement Ltd.	VEN-0001	Rajesh Kumar	9876543210	rajesh.kumar@ultratech.com	29ULTRA1234F1Z5	\N	Ahura Centre, B-Wing, 2nd Floor, Mahakali Caves Road, Andheri (East), Mumbai - 400093	Bangalore	\N	\N	\N	\N	\N	4.8	t	f	2026-05-15 15:19:36.623721	2026-05-21 18:15:25.970621
52	3	3	Tata Steel Ltd.	VEN-0002	Sanjay Singh	9876543211	sanjay.singh@tata.com	29TATA1234F1Z5	\N	Bombay House, 24, Homi Mody Street, Fort, Mumbai - 400001	Bangalore	\N	\N	\N	\N	\N	4.9	t	f	2026-05-15 15:19:36.625324	2026-05-21 18:15:25.970634
53	3	3	ACC Limited	VEN-0003	Amit Shah	9876543212	amit.shah@acc.com	29ACC1234F1Z5	\N	Cement House, 121, Maharshi Karve Road, Mumbai - 400020	Bangalore	\N	\N	\N	\N	\N	4.7	t	f	2026-05-15 15:19:36.627527	2026-05-21 18:15:25.970638
54	3	3	Asian Paints Ltd.	VEN-0004	Vijay Mallya	9876543213	vijay.mallya@asian.com	29ASIAN1234F1Z5	\N	6A, Shanti Nagar, Santacruz (East), Mumbai - 400055	Bangalore	\N	\N	\N	\N	\N	4.6	t	f	2026-05-15 15:19:36.628989	2026-05-21 18:15:25.970642
55	3	3	Kajaria Ceramics Ltd.	VEN-0005	Ramesh Patel	9876543214	ramesh.patel@kajaria.com	29KAJAR1234F1Z5	\N	J1/B1 (Extn.), Mohan Co-op Industrial Estate, Mathura Road, New Delhi - 110044	Bangalore	\N	\N	\N	\N	\N	4.5	t	f	2026-05-15 15:19:36.630558	2026-05-21 18:15:25.970645
56	3	3	Hindware Home Innovation Ltd.	VEN-0006	Suresh Raina	9876543215	suresh.raina@hindware.com	29HIND1234F1Z5	\N	301-302, 3rd Floor, Park Centra, Sector-30, Gurugram - 122001	Bangalore	\N	\N	\N	\N	\N	4.4	t	f	2026-05-15 15:19:36.631833	2026-05-21 18:15:25.970648
57	3	3	Havells India Ltd.	VEN-0007	Deepak Chahar	9876543216	deepak.chahar@havells.com	29HAVEL1234F1Z5	\N	QRG Towers, 2D, Sector-126, Expressway, Noida - 201304	Bangalore	\N	\N	\N	\N	\N	4.8	t	f	2026-05-15 15:19:36.633077	2026-05-21 18:15:25.970651
58	3	3	Jaquar & Company Pvt Ltd.	VEN-0008	Pankaj Tripathi	9876543217	pankaj.tripathi@jaquar.com	29JAQU1234F1Z5	\N	Plot No. 3, Sector - 11, IMT Manesar, Gurugram - 122050	Bangalore	\N	\N	\N	\N	\N	4.7	t	f	2026-05-15 15:19:36.634253	2026-05-21 18:15:25.970654
59	3	3	Dalmia Bharat Ltd.	VEN-0009	Arun Jaitley	9876543218	arun.jaitley@dalmia.com	29DALM1234F1Z5	\N	11th & 12th Floor, Hansalaya Building, 15, Barakhamba Road, New Delhi - 110001	Bangalore	\N	\N	\N	\N	\N	4.5	t	f	2026-05-15 15:19:36.63549	2026-05-21 18:15:25.970657
60	3	3	JSW Steel Ltd.	VEN-0010	Sajjan Jindal	9876543219	sajjan.jindal@jsw.com	29JSW1234F1Z5	\N	JSW Centre, Bandra Kurla Complex, Bandra (East), Mumbai - 400051	Bangalore	\N	\N	\N	\N	\N	4.9	t	f	2026-05-15 15:19:36.636606	2026-05-21 18:15:25.970659
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouses (id, tenant_id, site_id, name, code, project_id, warehouse_type, location, capacity, manager_name, manager_id, is_active, is_deleted, created_at) FROM stdin;
46	3	3	Main Civil Store	STO-0001	1	Main Store	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.638854
47	3	3	Hardware Store	STO-0002	1	Hardware	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.640399
48	3	3	Electrical Store	STO-0003	1	Electrical	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.641207
49	3	3	Plumbing Store	STO-0004	1	Plumbing	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.641993
50	3	3	Paint Store	STO-0005	1	Paint	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.642775
51	3	3	Stationary Store	STO-0006	1	Stationary	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.643719
52	3	3	Safety Equipment Store	STO-0007	1	Safety	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.644658
53	3	3	Consumables Store	STO-0008	1	Consumables	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.645359
54	3	3	Raw Material Store	STO-0009	1	Raw Material	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.64604
55	3	3	Finished Goods Store	STO-0010	1	Finished Goods	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.646716
56	3	3	Scrap Store	STO-0011	1	Scrap	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.647392
57	3	3	Site Store A	STO-0012	1	Site Store	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.648072
58	3	3	Site Store B	STO-0013	1	Site Store	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.648754
59	3	3	Central Warehouse	STO-0014	1	Central	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.649411
60	3	3	Regional Store	STO-0015	1	Regional	Bangalore	\N	\N	4	t	f	2026-05-15 15:19:36.650066
61	3	3	Scrap Store	SCRAP	1	Scrap	\N	\N	\N	\N	t	f	2026-05-20 12:59:53.29867
\.


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_id_seq', 1, false);


--
-- Name: approval_flows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approval_flows_id_seq', 2, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 53, true);


--
-- Name: buildings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buildings_id_seq', 4, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 50, true);


--
-- Name: current_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.current_stock_id_seq', 561, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 3, true);


--
-- Name: document_sequences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_sequences_id_seq', 30, true);


--
-- Name: floors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.floors_id_seq', 13, true);


--
-- Name: gate_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gate_entries_id_seq', 182, true);


--
-- Name: gate_passes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gate_passes_id_seq', 2, true);


--
-- Name: grn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grn_id_seq', 181, true);


--
-- Name: grn_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grn_items_id_seq', 462, true);


--
-- Name: indent_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indent_approvals_id_seq', 1, false);


--
-- Name: indent_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indent_items_id_seq', 460, true);


--
-- Name: indents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indents_id_seq', 196, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: material_issue_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_issue_items_id_seq', 187, true);


--
-- Name: material_issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_issues_id_seq', 210, true);


--
-- Name: material_return_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_return_items_id_seq', 6, true);


--
-- Name: material_returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_returns_id_seq', 15, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.materials_id_seq', 250, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.organizations_id_seq', 2, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 3, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 476, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 189, true);


--
-- Name: purchase_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_request_items_id_seq', 560, true);


--
-- Name: purchase_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_requests_id_seq', 186, true);


--
-- Name: quotation_comparisons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_comparisons_id_seq', 33, true);


--
-- Name: quotation_request_item_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_item_sources_id_seq', 8, true);


--
-- Name: quotation_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_items_id_seq', 368, true);


--
-- Name: quotation_request_prs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_prs_id_seq', 4, true);


--
-- Name: quotation_request_vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_vendors_id_seq', 370, true);


--
-- Name: quotation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_requests_id_seq', 183, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 253, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 9, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rooms_id_seq', 2, true);


--
-- Name: sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sites_id_seq', 3, true);


--
-- Name: stock_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_ledger_id_seq', 882, true);


--
-- Name: stock_transfer_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_transfer_items_id_seq', 1, false);


--
-- Name: stock_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_transfers_id_seq', 1, false);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 12, true);


--
-- Name: tenant_memberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_memberships_id_seq', 5, true);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenants_id_seq', 3, true);


--
-- Name: terms_and_conditions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.terms_and_conditions_id_seq', 1, true);


--
-- Name: uom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uom_id_seq', 20, true);


--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_role_assignments_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: vendor_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_categories_id_seq', 50, true);


--
-- Name: vendor_quotation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_quotation_items_id_seq', 1083, true);


--
-- Name: vendor_quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_quotations_id_seq', 541, true);


--
-- Name: vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendors_id_seq', 60, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 61, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: approval_flows approval_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT approval_flows_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: current_stock current_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock
    ADD CONSTRAINT current_stock_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: document_sequences document_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_pkey PRIMARY KEY (id);


--
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_pkey PRIMARY KEY (id);


--
-- Name: gate_entries gate_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_pkey PRIMARY KEY (id);


--
-- Name: gate_passes gate_passes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_pkey PRIMARY KEY (id);


--
-- Name: grn_items grn_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_pkey PRIMARY KEY (id);


--
-- Name: grn grn_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_pkey PRIMARY KEY (id);


--
-- Name: indent_approvals indent_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_approvals
    ADD CONSTRAINT indent_approvals_pkey PRIMARY KEY (id);


--
-- Name: indent_items indent_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_items
    ADD CONSTRAINT indent_items_pkey PRIMARY KEY (id);


--
-- Name: indents indents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: material_issue_items material_issue_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issue_items
    ADD CONSTRAINT material_issue_items_pkey PRIMARY KEY (id);


--
-- Name: material_issues material_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_pkey PRIMARY KEY (id);


--
-- Name: material_return_items material_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_return_items
    ADD CONSTRAINT material_return_items_pkey PRIMARY KEY (id);


--
-- Name: material_returns material_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_request_items purchase_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_request_items
    ADD CONSTRAINT purchase_request_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_requests purchase_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_pkey PRIMARY KEY (id);


--
-- Name: quotation_comparisons quotation_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_pkey PRIMARY KEY (id);


--
-- Name: quotation_request_item_sources quotation_request_item_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_item_sources
    ADD CONSTRAINT quotation_request_item_sources_pkey PRIMARY KEY (id);


--
-- Name: quotation_request_items quotation_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_items
    ADD CONSTRAINT quotation_request_items_pkey PRIMARY KEY (id);


--
-- Name: quotation_request_prs quotation_request_prs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_prs
    ADD CONSTRAINT quotation_request_prs_pkey PRIMARY KEY (id);


--
-- Name: quotation_request_vendors quotation_request_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_vendors
    ADD CONSTRAINT quotation_request_vendors_pkey PRIMARY KEY (id);


--
-- Name: quotation_requests quotation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT quotation_requests_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: stock_ledger stock_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_pkey PRIMARY KEY (id);


--
-- Name: stock_transfer_items stock_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: tenant_memberships tenant_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: terms_and_conditions terms_and_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_pkey PRIMARY KEY (id);


--
-- Name: uom uom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uom_pkey PRIMARY KEY (id);


--
-- Name: approval_flows uq_approval_flow_detailed; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT uq_approval_flow_detailed UNIQUE (tenant_id, site_id, document_type, level, role_name, user_id);


--
-- Name: categories uq_cat_per_site; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uq_cat_per_site UNIQUE (site_id, name);


--
-- Name: quotation_comparisons uq_comparison_per_qr_item; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT uq_comparison_per_qr_item UNIQUE (qr_id, qr_item_id);


--
-- Name: departments uq_dept_per_building; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT uq_dept_per_building UNIQUE (tenant_id, building_id, name);


--
-- Name: document_sequences uq_doc_seq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT uq_doc_seq UNIQUE (tenant_id, site_id, document_type);


--
-- Name: gate_entries uq_ge_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT uq_ge_per_tenant UNIQUE (tenant_id, entry_number);


--
-- Name: grn uq_grn_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT uq_grn_per_tenant UNIQUE (tenant_id, grn_number);


--
-- Name: indents uq_indent_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT uq_indent_per_tenant UNIQUE (tenant_id, indent_number);


--
-- Name: invoices uq_invoice_per_vendor_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT uq_invoice_per_vendor_tenant UNIQUE (tenant_id, invoice_number, vendor_id);


--
-- Name: material_issues uq_issue_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT uq_issue_per_tenant UNIQUE (tenant_id, issue_number);


--
-- Name: materials uq_mat_code_per_site; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT uq_mat_code_per_site UNIQUE (site_id, code);


--
-- Name: current_stock uq_material_warehouse; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock
    ADD CONSTRAINT uq_material_warehouse UNIQUE (material_id, warehouse_id);


--
-- Name: organizations uq_org_code_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT uq_org_code_per_tenant UNIQUE (tenant_id, code);


--
-- Name: purchase_orders uq_po_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT uq_po_per_tenant UNIQUE (tenant_id, po_number);


--
-- Name: purchase_requests uq_pr_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT uq_pr_per_tenant UNIQUE (tenant_id, pr_number);


--
-- Name: projects uq_proj_code_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT uq_proj_code_per_tenant UNIQUE (tenant_id, code);


--
-- Name: quotation_requests uq_qr_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT uq_qr_per_tenant UNIQUE (tenant_id, qr_number);


--
-- Name: quotation_request_prs uq_qr_pr; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_prs
    ADD CONSTRAINT uq_qr_pr UNIQUE (qr_id, pr_id);


--
-- Name: quotation_request_vendors uq_qr_vendor; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_vendors
    ADD CONSTRAINT uq_qr_vendor UNIQUE (qr_id, vendor_id);


--
-- Name: material_returns uq_ret_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT uq_ret_per_tenant UNIQUE (tenant_id, return_number);


--
-- Name: roles uq_role_code_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uq_role_code_per_tenant UNIQUE (tenant_id, code);


--
-- Name: role_permissions uq_role_resource; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_resource UNIQUE (role_id, resource);


--
-- Name: sites uq_site_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT uq_site_per_tenant UNIQUE (tenant_id, name);


--
-- Name: stock_transfers uq_trf_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT uq_trf_per_tenant UNIQUE (tenant_id, transfer_number);


--
-- Name: uom uq_uom_per_site; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uq_uom_per_site UNIQUE (site_id, name);


--
-- Name: tenant_memberships uq_user_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT uq_user_tenant UNIQUE (user_id, tenant_id);


--
-- Name: vendor_categories uq_vendor_category; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT uq_vendor_category UNIQUE (vendor_id, category_id);


--
-- Name: vendors uq_vendor_code_per_site; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT uq_vendor_code_per_site UNIQUE (site_id, code);


--
-- Name: warehouses uq_wh_code_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT uq_wh_code_per_tenant UNIQUE (tenant_id, code);


--
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendor_categories vendor_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_pkey PRIMARY KEY (id);


--
-- Name: vendor_quotation_items vendor_quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotation_items
    ADD CONSTRAINT vendor_quotation_items_pkey PRIMARY KEY (id);


--
-- Name: vendor_quotations vendor_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotations
    ADD CONSTRAINT vendor_quotations_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: ix_alerts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_alerts_id ON public.alerts USING btree (id);


--
-- Name: ix_approval_flows_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_approval_flows_id ON public.approval_flows USING btree (id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_buildings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buildings_id ON public.buildings USING btree (id);


--
-- Name: ix_categories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_categories_id ON public.categories USING btree (id);


--
-- Name: ix_current_stock_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_current_stock_id ON public.current_stock USING btree (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_document_sequences_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_document_sequences_id ON public.document_sequences USING btree (id);


--
-- Name: ix_floors_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_floors_id ON public.floors USING btree (id);


--
-- Name: ix_gate_entries_entry_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gate_entries_entry_number ON public.gate_entries USING btree (entry_number);


--
-- Name: ix_gate_entries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gate_entries_id ON public.gate_entries USING btree (id);


--
-- Name: ix_gate_passes_gate_pass_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gate_passes_gate_pass_number ON public.gate_passes USING btree (gate_pass_number);


--
-- Name: ix_gate_passes_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gate_passes_id ON public.gate_passes USING btree (id);


--
-- Name: ix_grn_grn_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_grn_grn_number ON public.grn USING btree (grn_number);


--
-- Name: ix_grn_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_grn_id ON public.grn USING btree (id);


--
-- Name: ix_grn_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_grn_items_id ON public.grn_items USING btree (id);


--
-- Name: ix_indent_approvals_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_indent_approvals_id ON public.indent_approvals USING btree (id);


--
-- Name: ix_indent_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_indent_items_id ON public.indent_items USING btree (id);


--
-- Name: ix_indents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_indents_id ON public.indents USING btree (id);


--
-- Name: ix_indents_indent_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_indents_indent_number ON public.indents USING btree (indent_number);


--
-- Name: ix_invoice_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_invoice_items_id ON public.invoice_items USING btree (id);


--
-- Name: ix_invoices_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_invoices_id ON public.invoices USING btree (id);


--
-- Name: ix_invoices_invoice_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_invoices_invoice_number ON public.invoices USING btree (invoice_number);


--
-- Name: ix_material_issue_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_material_issue_items_id ON public.material_issue_items USING btree (id);


--
-- Name: ix_material_issues_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_material_issues_id ON public.material_issues USING btree (id);


--
-- Name: ix_material_issues_issue_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_material_issues_issue_number ON public.material_issues USING btree (issue_number);


--
-- Name: ix_material_return_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_material_return_items_id ON public.material_return_items USING btree (id);


--
-- Name: ix_material_returns_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_material_returns_id ON public.material_returns USING btree (id);


--
-- Name: ix_material_returns_return_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_material_returns_return_number ON public.material_returns USING btree (return_number);


--
-- Name: ix_materials_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_materials_code ON public.materials USING btree (code);


--
-- Name: ix_materials_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_materials_id ON public.materials USING btree (id);


--
-- Name: ix_organizations_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_organizations_id ON public.organizations USING btree (id);


--
-- Name: ix_projects_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_projects_id ON public.projects USING btree (id);


--
-- Name: ix_purchase_order_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_order_items_id ON public.purchase_order_items USING btree (id);


--
-- Name: ix_purchase_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_orders_id ON public.purchase_orders USING btree (id);


--
-- Name: ix_purchase_orders_po_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_orders_po_number ON public.purchase_orders USING btree (po_number);


--
-- Name: ix_purchase_request_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_request_items_id ON public.purchase_request_items USING btree (id);


--
-- Name: ix_purchase_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_requests_id ON public.purchase_requests USING btree (id);


--
-- Name: ix_purchase_requests_pr_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_purchase_requests_pr_number ON public.purchase_requests USING btree (pr_number);


--
-- Name: ix_quotation_comparisons_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_comparisons_id ON public.quotation_comparisons USING btree (id);


--
-- Name: ix_quotation_request_item_sources_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_request_item_sources_id ON public.quotation_request_item_sources USING btree (id);


--
-- Name: ix_quotation_request_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_request_items_id ON public.quotation_request_items USING btree (id);


--
-- Name: ix_quotation_request_prs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_request_prs_id ON public.quotation_request_prs USING btree (id);


--
-- Name: ix_quotation_request_vendors_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_request_vendors_id ON public.quotation_request_vendors USING btree (id);


--
-- Name: ix_quotation_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_requests_id ON public.quotation_requests USING btree (id);


--
-- Name: ix_quotation_requests_qr_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotation_requests_qr_number ON public.quotation_requests USING btree (qr_number);


--
-- Name: ix_role_permissions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_role_permissions_id ON public.role_permissions USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_rooms_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_rooms_id ON public.rooms USING btree (id);


--
-- Name: ix_sites_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sites_id ON public.sites USING btree (id);


--
-- Name: ix_stock_ledger_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_ledger_id ON public.stock_ledger USING btree (id);


--
-- Name: ix_stock_transfer_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_transfer_items_id ON public.stock_transfer_items USING btree (id);


--
-- Name: ix_stock_transfers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_transfers_id ON public.stock_transfers USING btree (id);


--
-- Name: ix_stock_transfers_transfer_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stock_transfers_transfer_number ON public.stock_transfers USING btree (transfer_number);


--
-- Name: ix_subcategories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_subcategories_id ON public.subcategories USING btree (id);


--
-- Name: ix_tenant_memberships_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tenant_memberships_id ON public.tenant_memberships USING btree (id);


--
-- Name: ix_tenants_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tenants_id ON public.tenants USING btree (id);


--
-- Name: ix_tenants_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_tenants_slug ON public.tenants USING btree (slug);


--
-- Name: ix_terms_and_conditions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_terms_and_conditions_id ON public.terms_and_conditions USING btree (id);


--
-- Name: ix_uom_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_uom_id ON public.uom USING btree (id);


--
-- Name: ix_user_role_assignments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_role_assignments_id ON public.user_role_assignments USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_vendor_categories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendor_categories_id ON public.vendor_categories USING btree (id);


--
-- Name: ix_vendor_quotation_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendor_quotation_items_id ON public.vendor_quotation_items USING btree (id);


--
-- Name: ix_vendor_quotations_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendor_quotations_id ON public.vendor_quotations USING btree (id);


--
-- Name: ix_vendors_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendors_id ON public.vendors USING btree (id);


--
-- Name: ix_warehouses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouses_id ON public.warehouses USING btree (id);


--
-- Name: alerts alerts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: alerts alerts_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: alerts alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: approval_flows approval_flows_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT approval_flows_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: approval_flows approval_flows_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT approval_flows_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: approval_flows approval_flows_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT approval_flows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id);


--
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: buildings buildings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: buildings buildings_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: buildings buildings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: categories categories_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: categories categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: current_stock current_stock_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock
    ADD CONSTRAINT current_stock_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: current_stock current_stock_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock
    ADD CONSTRAINT current_stock_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: current_stock current_stock_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock
    ADD CONSTRAINT current_stock_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: current_stock current_stock_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_stock
    ADD CONSTRAINT current_stock_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: departments departments_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: departments departments_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: departments departments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: document_sequences document_sequences_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: document_sequences document_sequences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_sequences
    ADD CONSTRAINT document_sequences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: materials fk_materials_warehouse; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT fk_materials_warehouse FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: floors floors_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: floors floors_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: floors floors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gate_entries gate_entries_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: gate_entries gate_entries_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: gate_entries gate_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: gate_entries gate_entries_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id);


--
-- Name: gate_entries gate_entries_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: gate_entries gate_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gate_entries gate_entries_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_entries
    ADD CONSTRAINT gate_entries_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: gate_passes gate_passes_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: gate_passes gate_passes_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: gate_passes gate_passes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: gate_passes gate_passes_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.material_returns(id) ON DELETE SET NULL;


--
-- Name: gate_passes gate_passes_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: gate_passes gate_passes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gate_passes gate_passes_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gate_passes
    ADD CONSTRAINT gate_passes_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;


--
-- Name: grn grn_gate_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_gate_entry_id_fkey FOREIGN KEY (gate_entry_id) REFERENCES public.gate_entries(id);


--
-- Name: grn grn_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: grn_items grn_items_grn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.grn(id);


--
-- Name: grn_items grn_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: grn_items grn_items_po_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn_items
    ADD CONSTRAINT grn_items_po_item_id_fkey FOREIGN KEY (po_item_id) REFERENCES public.purchase_order_items(id);


--
-- Name: grn grn_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: grn grn_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: grn grn_received_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_received_by_id_fkey FOREIGN KEY (received_by_id) REFERENCES public.users(id);


--
-- Name: grn grn_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: grn grn_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: grn grn_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: grn grn_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grn
    ADD CONSTRAINT grn_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: indent_approvals indent_approvals_approval_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_approvals
    ADD CONSTRAINT indent_approvals_approval_flow_id_fkey FOREIGN KEY (approval_flow_id) REFERENCES public.approval_flows(id);


--
-- Name: indent_approvals indent_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_approvals
    ADD CONSTRAINT indent_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: indent_approvals indent_approvals_indent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_approvals
    ADD CONSTRAINT indent_approvals_indent_id_fkey FOREIGN KEY (indent_id) REFERENCES public.indents(id) ON DELETE CASCADE;


--
-- Name: indent_items indent_items_indent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_items
    ADD CONSTRAINT indent_items_indent_id_fkey FOREIGN KEY (indent_id) REFERENCES public.indents(id);


--
-- Name: indent_items indent_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indent_items
    ADD CONSTRAINT indent_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: indents indents_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: indents indents_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: indents indents_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: indents indents_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: indents indents_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: indents indents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.indents
    ADD CONSTRAINT indents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: invoices invoices_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_gate_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_gate_entry_id_fkey FOREIGN KEY (gate_entry_id) REFERENCES public.gate_entries(id);


--
-- Name: invoices invoices_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: invoices invoices_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: material_issue_items material_issue_items_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issue_items
    ADD CONSTRAINT material_issue_items_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.material_issues(id);


--
-- Name: material_issue_items material_issue_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issue_items
    ADD CONSTRAINT material_issue_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: material_issues material_issues_acknowledged_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_acknowledged_by_id_fkey FOREIGN KEY (acknowledged_by_id) REFERENCES public.users(id);


--
-- Name: material_issues material_issues_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: material_issues material_issues_indent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_indent_id_fkey FOREIGN KEY (indent_id) REFERENCES public.indents(id);


--
-- Name: material_issues material_issues_issued_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_issued_by_id_fkey FOREIGN KEY (issued_by_id) REFERENCES public.users(id);


--
-- Name: material_issues material_issues_issued_to_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_issued_to_room_id_fkey FOREIGN KEY (issued_to_room_id) REFERENCES public.rooms(id);


--
-- Name: material_issues material_issues_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: material_issues material_issues_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: material_issues material_issues_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: material_issues material_issues_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_issues
    ADD CONSTRAINT material_issues_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: material_return_items material_return_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_return_items
    ADD CONSTRAINT material_return_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: material_return_items material_return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_return_items
    ADD CONSTRAINT material_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.material_returns(id);


--
-- Name: material_returns material_returns_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: material_returns material_returns_received_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_received_by_id_fkey FOREIGN KEY (received_by_id) REFERENCES public.users(id);


--
-- Name: material_returns material_returns_returned_from_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_returned_from_room_id_fkey FOREIGN KEY (returned_from_room_id) REFERENCES public.rooms(id);


--
-- Name: material_returns material_returns_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: material_returns material_returns_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: material_returns material_returns_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_returns
    ADD CONSTRAINT material_returns_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: materials materials_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: materials materials_preferred_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_preferred_vendor_id_fkey FOREIGN KEY (preferred_vendor_id) REFERENCES public.vendors(id);


--
-- Name: materials materials_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: materials materials_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: materials materials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: materials materials_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(id);


--
-- Name: organizations organizations_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: projects projects_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: projects projects_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: projects projects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_orders purchase_orders_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: purchase_orders purchase_orders_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: purchase_orders purchase_orders_indent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_indent_id_fkey FOREIGN KEY (indent_id) REFERENCES public.indents(id);


--
-- Name: purchase_orders purchase_orders_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pr_id_fkey FOREIGN KEY (pr_id) REFERENCES public.purchase_requests(id);


--
-- Name: purchase_orders purchase_orders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: purchase_orders purchase_orders_qr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_qr_id_fkey FOREIGN KEY (qr_id) REFERENCES public.quotation_requests(id);


--
-- Name: purchase_orders purchase_orders_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: purchase_request_items purchase_request_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_request_items
    ADD CONSTRAINT purchase_request_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: purchase_request_items purchase_request_items_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_request_items
    ADD CONSTRAINT purchase_request_items_pr_id_fkey FOREIGN KEY (pr_id) REFERENCES public.purchase_requests(id);


--
-- Name: purchase_requests purchase_requests_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: purchase_requests purchase_requests_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: purchase_requests purchase_requests_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: purchase_requests purchase_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id);


--
-- Name: purchase_requests purchase_requests_required_for_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_required_for_room_id_fkey FOREIGN KEY (required_for_room_id) REFERENCES public.rooms(id);


--
-- Name: purchase_requests purchase_requests_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: purchase_requests purchase_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quotation_comparisons quotation_comparisons_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: quotation_comparisons quotation_comparisons_auto_rank_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_auto_rank_vendor_id_fkey FOREIGN KEY (auto_rank_vendor_id) REFERENCES public.vendors(id);


--
-- Name: quotation_comparisons quotation_comparisons_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: quotation_comparisons quotation_comparisons_qr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_qr_id_fkey FOREIGN KEY (qr_id) REFERENCES public.quotation_requests(id) ON DELETE CASCADE;


--
-- Name: quotation_comparisons quotation_comparisons_qr_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_qr_item_id_fkey FOREIGN KEY (qr_item_id) REFERENCES public.quotation_request_items(id);


--
-- Name: quotation_comparisons quotation_comparisons_selected_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_comparisons
    ADD CONSTRAINT quotation_comparisons_selected_vendor_id_fkey FOREIGN KEY (selected_vendor_id) REFERENCES public.vendors(id);


--
-- Name: quotation_request_item_sources quotation_request_item_sources_qr_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_item_sources
    ADD CONSTRAINT quotation_request_item_sources_qr_item_id_fkey FOREIGN KEY (qr_item_id) REFERENCES public.quotation_request_items(id) ON DELETE CASCADE;


--
-- Name: quotation_request_item_sources quotation_request_item_sources_source_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_item_sources
    ADD CONSTRAINT quotation_request_item_sources_source_pr_id_fkey FOREIGN KEY (source_pr_id) REFERENCES public.purchase_requests(id);


--
-- Name: quotation_request_items quotation_request_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_items
    ADD CONSTRAINT quotation_request_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: quotation_request_items quotation_request_items_qr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_items
    ADD CONSTRAINT quotation_request_items_qr_id_fkey FOREIGN KEY (qr_id) REFERENCES public.quotation_requests(id) ON DELETE CASCADE;


--
-- Name: quotation_request_items quotation_request_items_source_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_items
    ADD CONSTRAINT quotation_request_items_source_pr_id_fkey FOREIGN KEY (source_pr_id) REFERENCES public.purchase_requests(id);


--
-- Name: quotation_request_prs quotation_request_prs_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_prs
    ADD CONSTRAINT quotation_request_prs_pr_id_fkey FOREIGN KEY (pr_id) REFERENCES public.purchase_requests(id);


--
-- Name: quotation_request_prs quotation_request_prs_qr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_prs
    ADD CONSTRAINT quotation_request_prs_qr_id_fkey FOREIGN KEY (qr_id) REFERENCES public.quotation_requests(id) ON DELETE CASCADE;


--
-- Name: quotation_request_vendors quotation_request_vendors_qr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_vendors
    ADD CONSTRAINT quotation_request_vendors_qr_id_fkey FOREIGN KEY (qr_id) REFERENCES public.quotation_requests(id) ON DELETE CASCADE;


--
-- Name: quotation_request_vendors quotation_request_vendors_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_request_vendors
    ADD CONSTRAINT quotation_request_vendors_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: quotation_requests quotation_requests_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT quotation_requests_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: quotation_requests quotation_requests_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT quotation_requests_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: quotation_requests quotation_requests_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT quotation_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: quotation_requests quotation_requests_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT quotation_requests_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: quotation_requests quotation_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_requests
    ADD CONSTRAINT quotation_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_floor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_floor_id_fkey FOREIGN KEY (floor_id) REFERENCES public.floors(id);


--
-- Name: rooms rooms_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sites sites_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: stock_ledger stock_ledger_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: stock_ledger stock_ledger_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: stock_ledger stock_ledger_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: stock_ledger stock_ledger_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: stock_ledger stock_ledger_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: stock_ledger stock_ledger_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: stock_ledger stock_ledger_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_transfer_items stock_transfer_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: stock_transfer_items stock_transfer_items_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.stock_transfers(id);


--
-- Name: stock_transfers stock_transfers_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: stock_transfers stock_transfers_from_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_from_warehouse_id_fkey FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_transfers stock_transfers_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: stock_transfers stock_transfers_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_to_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_to_warehouse_id_fkey FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: subcategories subcategories_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: subcategories subcategories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_memberships tenant_memberships_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_memberships tenant_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_memberships
    ADD CONSTRAINT tenant_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: terms_and_conditions terms_and_conditions_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: terms_and_conditions terms_and_conditions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: uom uom_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uom_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: uom uom_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uom_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_role_assignments user_role_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vendor_categories vendor_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: vendor_categories vendor_categories_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendor_quotation_items vendor_quotation_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotation_items
    ADD CONSTRAINT vendor_quotation_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: vendor_quotation_items vendor_quotation_items_qr_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotation_items
    ADD CONSTRAINT vendor_quotation_items_qr_item_id_fkey FOREIGN KEY (qr_item_id) REFERENCES public.quotation_request_items(id);


--
-- Name: vendor_quotation_items vendor_quotation_items_vendor_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotation_items
    ADD CONSTRAINT vendor_quotation_items_vendor_quotation_id_fkey FOREIGN KEY (vendor_quotation_id) REFERENCES public.vendor_quotations(id) ON DELETE CASCADE;


--
-- Name: vendor_quotations vendor_quotations_entered_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotations
    ADD CONSTRAINT vendor_quotations_entered_by_id_fkey FOREIGN KEY (entered_by_id) REFERENCES public.users(id);


--
-- Name: vendor_quotations vendor_quotations_qr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotations
    ADD CONSTRAINT vendor_quotations_qr_id_fkey FOREIGN KEY (qr_id) REFERENCES public.quotation_requests(id) ON DELETE CASCADE;


--
-- Name: vendor_quotations vendor_quotations_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_quotations
    ADD CONSTRAINT vendor_quotations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: vendors vendors_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: warehouses warehouses_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: warehouses warehouses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: warehouses warehouses_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: warehouses warehouses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict S10HbPBVFepS0Rx6TtRDOWfkfgZJ6OW04WOeSoiIZb2ojQ58EEUra6tvFmKzFvt

