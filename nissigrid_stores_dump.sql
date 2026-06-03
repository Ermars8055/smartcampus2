--
-- PostgreSQL database dump
--

\restrict YsEdpVHT7I9nDlHrMNHi3PVu1BGziaduLCsDXoZ8G6g5Neg6adhXvbl74m7Z3Ld

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
-- Name: company_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_addresses (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    site_id integer NOT NULL,
    address_type character varying(50),
    address text NOT NULL,
    gst_number character varying(20),
    state character varying(100),
    is_active boolean,
    is_deleted boolean,
    created_at timestamp without time zone,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    contact_person character varying(255),
    phone character varying(20),
    email character varying(255),
    pan_number character varying(15),
    city character varying(100),
    pincode character varying(10),
    bank_name character varying(100),
    bank_account character varying(50),
    ifsc_code character varying(20),
    updated_at timestamp without time zone
);


ALTER TABLE public.company_addresses OWNER TO postgres;

--
-- Name: company_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_addresses_id_seq OWNER TO postgres;

--
-- Name: company_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_addresses_id_seq OWNED BY public.company_addresses.id;


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
    amount double precision NOT NULL,
    remarks text
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
    total_discount double precision,
    consignee_id integer,
    buyer_id integer,
    internal_reference_number character varying(100),
    srf_number character varying(100),
    irn text,
    ack_number character varying(100),
    ack_date date,
    transport_charges double precision,
    transport_hsn character varying(50),
    transport_cgst_rate double precision,
    transport_sgst_rate double precision,
    transport_igst_rate double precision,
    transport_discount_percent double precision,
    code character varying(50) NOT NULL
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
    warehouse_id integer,
    alias character varying(500),
    reference_no character varying(50)
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
    igst_percentage double precision DEFAULT 0,
    is_gst_inclusive boolean
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
    created_at timestamp without time zone,
    data_access_scope character varying(50)
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
    updated_at timestamp without time zone,
    department character varying(255)
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
-- Name: company_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses ALTER COLUMN id SET DEFAULT nextval('public.company_addresses_id_seq'::regclass);


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
cb0e38d939b8
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, tenant_id, site_id, alert_type, severity, title, message, reference_type, reference_id, project_id, is_read, is_resolved, created_at, resolved_at) FROM stdin;
1	3	3	Pending Action	Warning	Action Required: Gate Entry GE-00024	\N	GateEntry	189	\N	t	t	2026-06-03 11:53:22.926354	2026-06-03 11:53:27.499255
2	3	3	Pending Action	Warning	Action Required: Gate Entry GE-00018	\N	GateEntry	183	\N	t	t	2026-06-03 11:53:25.711798	2026-06-03 11:53:28.313831
\.


--
-- Data for Name: approval_flows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_flows (id, tenant_id, site_id, document_type, level, role_name, min_amount, max_amount, user_id, is_active) FROM stdin;
3	3	3	INDENT	1	Store Manager	55555	\N	5	t
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
54	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 09:58:03.024778
55	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 10:13:34.708267
56	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 10:23:44.805542
57	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 12:00:15.25512
58	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 12:11:32.271549
59	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 12:18:39.572203
60	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 12:41:05.8932
61	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 12:42:10.415528
62	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 13:19:22.773573
63	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 14:19:16.954151
64	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 14:20:51.35499
65	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 14:40:36.13323
66	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 15:12:16.777373
67	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 15:13:06.54912
68	3	3	4	CREATE	Material	251	\N	Created material: Water Tank 500 ML	\N	2026-06-01 16:46:02.51505
69	3	3	4	APPROVE	PurchaseRequest	187	\N	\N	\N	2026-06-01 16:47:05.572459
70	3	3	4	APPROVE	PurchaseRequest	187	\N	\N	\N	2026-06-01 16:47:10.201148
71	3	3	4	APPROVE	PurchaseRequest	188	\N	\N	\N	2026-06-01 16:47:40.527531
72	3	3	4	APPROVE	PurchaseRequest	188	\N	\N	\N	2026-06-01 16:47:45.136948
73	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 18:27:54.13439
74	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-06-01 18:41:55.217758
75	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-06-01 19:07:55.060406
76	2	\N	3	LOGIN	User	3	\N	\N	\N	2026-06-01 19:20:39.038868
77	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 19:23:18.619274
78	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-01 19:29:55.281238
79	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-01 19:45:48.919791
80	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-02 10:11:52.469917
81	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-02 10:12:11.945862
82	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-02 10:13:27.424295
83	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-02 10:24:10.751377
84	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-02 10:24:59.86063
85	3	\N	8	LOGIN	User	8	\N	\N	\N	2026-06-02 10:27:24.916645
86	3	\N	7	LOGIN	User	7	\N	\N	\N	2026-06-02 10:30:56.76968
87	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-02 10:39:58.632911
88	3	\N	7	LOGIN	User	7	\N	\N	\N	2026-06-02 10:41:48.420114
89	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-02 10:42:14.2846
90	3	3	4	UPDATE	Material	216	\N	\N	\N	2026-06-02 11:39:08.515465
91	3	3	4	UPDATE	Material	216	\N	\N	\N	2026-06-02 11:40:07.904028
92	3	3	4	UPDATE	Material	216	\N	\N	\N	2026-06-02 11:41:27.492816
93	\N	\N	1	LOGIN	User	1	\N	\N	\N	2026-06-02 12:03:11.913037
94	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-02 12:05:01.055121
95	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-02 13:42:08.567607
96	3	\N	9	LOGIN	User	9	\N	\N	\N	2026-06-02 13:44:20.324719
97	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-02 15:31:25.555412
98	3	3	4	CREATE	GRN	182	\N	GRN GRN-00017 created (PO-Based)	\N	2026-06-02 18:01:24.102864
99	3	3	4	CREATE	GRN	183	\N	GRN GRN-00018 created (PO-Based)	\N	2026-06-02 18:01:36.981764
100	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-02 18:17:02.415318
101	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-03 10:32:53.400047
102	3	\N	4	LOGIN	User	4	\N	\N	\N	2026-06-03 11:01:43.39137
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
51	3	3	CIVIL	\N	CAT-0011	Hospital category: CIVIL	t	f
52	3	3	ELECTRICAL	\N	CAT-0012	Hospital category: ELECTRICAL	t	f
53	3	3	HOSP EQPT	\N	CAT-0013	Hospital category: HOSP EQPT	t	f
54	3	3	HOSPITAL	\N	CAT-0014	Hospital category: HOSPITAL	t	f
55	3	3	INSTRUMENTS	\N	CAT-0015	Hospital category: INSTRUMENTS	t	f
56	3	3	HOUSE KEEPING	\N	CAT-0016	Hospital category: HOUSE KEEPING	t	f
57	3	3	IT	\N	CAT-0017	Hospital category: IT	t	f
58	3	3	LAB	\N	CAT-0018	Hospital category: LAB	t	f
59	3	3	LINEN	\N	CAT-0019	Hospital category: LINEN	t	f
60	3	3	PLUMBING	\N	CAT-0020	Hospital category: PLUMBING	t	f
61	3	3	RADIOLOGY	\N	CAT-0021	Hospital category: RADIOLOGY	t	f
62	3	3	STATIONERY	\N	CAT-0022	Hospital category: STATIONERY	t	f
63	3	3	HOSPITAL INSTRUMENTS	\N	CAT-EXCEL-0023	Imported Category: HOSPITAL INSTRUMENTS	t	f
\.


--
-- Data for Name: company_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_addresses (id, tenant_id, site_id, address_type, address, gst_number, state, is_active, is_deleted, created_at, name, code, contact_person, phone, email, pan_number, city, pincode, bank_name, bank_account, ifsc_code, updated_at) FROM stdin;
2	3	3	Billing	Jnana Prabha Campus,\nBidarahalli, Virgonagar	29AAAAA0000A1Z5	29 - Karnataka	t	f	2026-06-02 16:55:06.024509	Helios Construction LLP	ADDR-00002	kumar	98000004444	helios@gmail.com		Bangalore	560049				2026-06-02 17:22:10.040431
3	3	3	Billing	113, JNANA PRABHA CAMPUS, BIDARAHALLI, VIRGO NAGAR POST	29AAAAA0000A1Z5	29 - Karnataka	t	f	2026-06-02 17:37:58.632191	EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER	ADDR-00003					Bangalore	560049				2026-06-02 17:37:58.63221
1	3	3	Billing	Jnana Prabha Campus,\nBidarahalli, Virgonagar	29AAAAA0000A1Z5	29 - Karnataka	t	f	2026-06-02 16:41:32.765533	MG Charitable Trust	ADDR-00001	pradnesh	9842003333	mgcharitabletrust@gmail.com		Bangalore	560049				2026-06-02 17:38:37.233401
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
1275	3	3	965	46	41	2026-06-03 12:31:53.855823
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
1276	3	3	966	46	100	2026-06-03 12:31:53.860198
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
1277	3	3	967	46	283	2026-06-03 12:31:53.862835
454	3	3	244	50	46.5	2026-05-15 17:47:33.132785
445	3	3	229	58	54	2026-05-15 17:47:33.137115
438	3	3	231	51	46	2026-05-15 17:47:33.140641
479	3	3	239	55	65	2026-05-15 18:52:30.865989
526	3	3	223	58	62	2026-05-15 18:52:30.873778
1278	3	3	968	46	153	2026-06-03 12:31:53.865606
509	3	3	243	52	80	2026-05-15 18:52:30.992524
393	3	3	232	59	82	2026-05-15 18:52:31.012026
405	3	3	216	57	60.5	2026-05-15 18:52:31.020547
478	3	3	232	46	73	2026-05-15 18:52:31.031369
512	3	3	248	52	53	2026-05-15 18:52:31.03492
436	3	3	245	53	55	2026-05-15 18:52:31.047952
1279	3	3	969	46	16	2026-06-03 12:31:53.867912
1280	3	3	970	46	59	2026-06-03 12:31:53.870426
1281	3	3	971	46	125	2026-06-03 12:31:53.872813
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
1282	3	3	972	46	393	2026-06-03 12:31:53.874738
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
417	3	3	222	59	80	2026-06-02 18:31:45.262029
461	3	3	222	54	143	2026-05-15 15:54:48.098537
371	3	3	219	53	30.5	2026-05-15 15:26:16.089739
332	3	3	234	54	3990	2026-06-01 14:57:06.627169
348	3	3	250	54	2927	2026-05-15 15:26:16.103181
366	3	3	246	58	82	2026-05-15 15:54:48.272354
432	3	3	249	54	190.5	2026-05-15 15:54:48.101978
465	3	3	226	50	56	2026-05-15 15:44:34.758308
1283	3	3	973	46	110	2026-06-03 12:31:53.876938
362	3	3	220	49	60	2026-05-15 15:26:16.131087
314	3	3	216	54	115	2026-05-15 15:19:36.65486
316	3	3	218	46	1018	2026-05-15 15:19:36.661376
317	3	3	219	54	303	2026-05-15 15:19:36.663625
325	3	3	227	46	4	2026-05-15 15:19:36.68029
329	3	3	231	47	246	2026-05-15 15:19:36.688023
331	3	3	233	54	25	2026-05-15 15:19:36.692338
1284	3	3	974	46	59	2026-06-03 12:31:53.879054
337	3	3	239	46	7	2026-05-15 15:19:36.704119
341	3	3	243	51	6	2026-05-15 15:19:36.711535
345	3	3	247	52	31	2026-05-15 15:19:36.718793
350	3	3	228	60	84	2026-05-15 15:19:37.70502
353	3	3	235	55	76	2026-05-15 15:19:37.722644
355	3	3	242	55	90	2026-05-15 15:19:37.732147
370	3	3	223	56	26	2026-05-15 15:19:37.79565
365	3	3	250	60	96.5	2026-05-15 15:19:37.809396
344	3	3	246	48	192	2026-06-02 18:01:24.104854
377	3	3	216	49	44	2026-05-15 15:19:37.829783
378	3	3	248	49	35	2026-05-15 15:19:37.831996
322	3	3	224	46	0	2026-05-26 17:33:32.450609
473	3	3	241	53	62	2026-05-15 17:47:33.080195
333	3	3	235	49	8	2026-05-15 15:19:37.860109
343	3	3	245	47	235	2026-05-15 15:41:44.040295
330	3	3	232	50	8	2026-05-26 18:25:34.291366
346	3	3	248	47	84	2026-05-15 15:54:48.115168
368	3	3	228	56	38.5	2026-05-15 15:19:37.880273
477	3	3	232	48	172	2026-06-02 18:01:24.104871
335	3	3	237	51	8	2026-05-15 15:44:34.891604
363	3	3	244	54	50	2026-05-15 15:19:37.89399
424	3	3	218	60	102.5	2026-05-15 15:41:44.062927
357	3	3	223	55	124	2026-05-15 15:41:44.106851
323	3	3	225	50	11	2026-05-26 18:19:24.670639
347	3	3	249	46	218	2026-05-15 15:54:48.196027
462	3	3	233	56	79	2026-05-15 15:44:34.908322
413	3	3	233	59	49	2026-05-15 15:41:44.180434
415	3	3	237	47	73	2026-05-15 15:54:48.277251
1285	3	3	975	46	39	2026-06-03 12:31:53.881155
468	3	3	237	54	97	2026-05-15 15:44:34.77051
342	3	3	244	55	47	2026-06-01 14:57:06.723764
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
1286	3	3	976	46	24	2026-06-03 12:31:53.883167
373	3	3	232	60	41	2026-05-15 15:54:48.30732
469	3	3	227	60	75	2026-05-15 15:54:48.31184
1287	3	3	977	46	39	2026-06-03 12:31:53.885125
420	3	3	245	54	96	2026-05-15 15:54:48.32067
369	3	3	250	56	133	2026-05-15 17:47:33.120829
372	3	3	220	53	159.5	2026-05-15 17:47:33.128865
467	3	3	247	54	158	2026-05-15 18:52:30.830983
411	3	3	228	54	182	2026-05-15 18:52:30.833114
374	3	3	233	60	166.5	2026-05-15 18:52:30.846946
360	3	3	224	48	161	2026-05-15 18:52:30.881407
327	3	3	229	46	71	2026-05-15 18:52:31.038678
1288	3	3	978	46	70	2026-06-03 12:31:53.887377
1289	3	3	979	46	425	2026-06-03 12:31:53.889432
1290	3	3	980	46	486	2026-06-03 12:31:53.891353
1291	3	3	981	46	87	2026-06-03 12:31:53.893311
1292	3	3	982	46	113	2026-06-03 12:31:53.895306
1293	3	3	983	46	44	2026-06-03 12:31:53.897242
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
1294	3	3	984	46	28	2026-06-03 12:31:53.899285
558	3	3	244	56	0	2026-05-20 12:47:03.329355
1295	3	3	985	46	59	2026-06-03 12:31:53.901226
559	3	3	230	56	0	2026-05-20 12:50:39.839919
538	3	3	246	59	85	2026-05-20 12:51:33.8159
560	3	3	230	59	1	2026-05-20 12:53:43.088482
561	3	3	230	61	1	2026-05-20 12:59:53.319596
562	3	3	224	59	100	2026-06-02 18:01:36.984569
1296	3	3	986	46	52	2026-06-03 12:31:53.903359
1297	3	3	987	46	95	2026-06-03 12:31:53.905383
1298	3	3	988	46	35	2026-06-03 12:31:53.907322
1299	3	3	989	46	25	2026-06-03 12:31:53.90922
1300	3	3	990	46	308	2026-06-03 12:31:53.911328
1301	3	3	991	46	480	2026-06-03 12:31:53.913262
1302	3	3	992	46	182	2026-06-03 12:31:53.915699
1303	3	3	993	46	103	2026-06-03 12:31:53.917673
1304	3	3	994	46	128	2026-06-03 12:31:53.919973
1305	3	3	995	46	376	2026-06-03 12:31:53.92206
1306	3	3	996	46	53	2026-06-03 12:31:53.923981
1307	3	3	997	46	21	2026-06-03 12:31:53.925879
1308	3	3	998	46	342	2026-06-03 12:31:53.927923
1309	3	3	999	46	53	2026-06-03 12:31:53.929863
1310	3	3	1000	46	286	2026-06-03 12:31:53.931941
1311	3	3	1001	46	44	2026-06-03 12:31:53.933899
1312	3	3	1002	46	239	2026-06-03 12:31:53.936017
1313	3	3	1003	46	27	2026-06-03 12:31:53.93832
1314	3	3	1004	46	29	2026-06-03 12:31:53.940334
1315	3	3	1005	46	36	2026-06-03 12:31:53.942208
1316	3	3	1006	46	51	2026-06-03 12:31:53.944305
1317	3	3	1007	46	37	2026-06-03 12:31:53.946268
1318	3	3	1008	46	39	2026-06-03 12:31:53.948422
1319	3	3	1009	46	30	2026-06-03 12:31:53.950369
1320	3	3	1010	46	22	2026-06-03 12:31:53.952408
1321	3	3	1011	46	421	2026-06-03 12:31:53.954775
1322	3	3	1012	46	93	2026-06-03 12:31:53.956766
1323	3	3	1013	46	24	2026-06-03 12:31:53.958631
1324	3	3	1014	46	19	2026-06-03 12:31:53.960618
1325	3	3	1015	46	899	2026-06-03 12:31:53.962599
1326	3	3	1016	46	139	2026-06-03 12:31:53.964523
1327	3	3	1017	46	99	2026-06-03 12:31:53.966436
1328	3	3	1018	46	902	2026-06-03 12:31:53.968347
1329	3	3	1019	46	67	2026-06-03 12:31:53.970569
1330	3	3	1020	46	130	2026-06-03 12:31:53.972635
1331	3	3	1021	46	17	2026-06-03 12:31:53.974597
1332	3	3	1022	46	16	2026-06-03 12:31:53.976579
1333	3	3	1023	46	23	2026-06-03 12:31:53.978567
1334	3	3	1024	46	21	2026-06-03 12:31:53.980694
1335	3	3	1025	46	109	2026-06-03 12:31:53.98269
1336	3	3	1026	46	14	2026-06-03 12:31:53.984583
1337	3	3	1027	46	19	2026-06-03 12:31:53.986814
1338	3	3	1028	46	83	2026-06-03 12:31:53.988969
1339	3	3	1029	46	26	2026-06-03 12:31:53.990902
1340	3	3	1030	46	67	2026-06-03 12:31:53.992777
1341	3	3	1031	46	495	2026-06-03 12:31:53.994898
1342	3	3	1032	46	52	2026-06-03 12:31:53.996853
1343	3	3	1033	46	139	2026-06-03 12:31:53.99896
1344	3	3	1034	46	53	2026-06-03 12:31:54.000889
1345	3	3	1035	46	54	2026-06-03 12:31:54.003117
1346	3	3	1036	46	21	2026-06-03 12:31:54.005298
1347	3	3	1037	46	903	2026-06-03 12:31:54.007281
1348	3	3	1038	46	28	2026-06-03 12:31:54.009157
1349	3	3	1039	46	774	2026-06-03 12:31:54.011214
1350	3	3	1040	59	109	2026-06-03 12:31:54.013181
1351	3	3	1041	59	18	2026-06-03 12:31:54.015171
1352	3	3	1042	59	147	2026-06-03 12:31:54.017144
1353	3	3	1043	59	30	2026-06-03 12:31:54.019118
1354	3	3	1044	59	23	2026-06-03 12:31:54.021325
1355	3	3	1045	59	26	2026-06-03 12:31:54.023351
1356	3	3	1046	59	132	2026-06-03 12:31:54.02531
1357	3	3	1047	59	89	2026-06-03 12:31:54.027372
1358	3	3	1048	59	850	2026-06-03 12:31:54.029354
1359	3	3	1049	59	75	2026-06-03 12:31:54.03122
1360	3	3	1050	59	23	2026-06-03 12:31:54.033287
1361	3	3	1051	59	52	2026-06-03 12:31:54.035211
1362	3	3	1052	59	65	2026-06-03 12:31:54.038535
1363	3	3	1053	59	102	2026-06-03 12:31:54.040617
1364	3	3	1054	59	105	2026-06-03 12:31:54.042543
1365	3	3	1055	59	59	2026-06-03 12:31:54.0446
1366	3	3	1056	59	19	2026-06-03 12:31:54.04653
1367	3	3	1057	59	119	2026-06-03 12:31:54.048473
1368	3	3	1058	59	149	2026-06-03 12:31:54.050524
1369	3	3	1059	59	9	2026-06-03 12:31:54.052562
1370	3	3	1060	59	41	2026-06-03 12:31:54.054865
1371	3	3	1061	59	22	2026-06-03 12:31:54.056889
1372	3	3	1062	59	75	2026-06-03 12:31:54.058791
1373	3	3	1063	59	113	2026-06-03 12:31:54.060842
1374	3	3	1064	59	363	2026-06-03 12:31:54.062795
1375	3	3	1065	59	64	2026-06-03 12:31:54.064674
1376	3	3	1066	59	139	2026-06-03 12:31:54.066669
1377	3	3	1067	59	179	2026-06-03 12:31:54.068542
1378	3	3	1068	59	59	2026-06-03 12:31:54.070791
1379	3	3	1069	59	60	2026-06-03 12:31:54.072848
1380	3	3	1070	59	29	2026-06-03 12:31:54.074748
1381	3	3	1071	59	37	2026-06-03 12:31:54.07662
1382	3	3	1072	59	2	2026-06-03 12:31:54.078677
1383	3	3	1073	59	35	2026-06-03 12:31:54.080465
1384	3	3	1074	59	86	2026-06-03 12:31:54.082456
1385	3	3	1075	59	16	2026-06-03 12:31:54.084426
1386	3	3	1076	59	38	2026-06-03 12:31:54.086519
1387	3	3	1077	59	114	2026-06-03 12:31:54.088766
1388	3	3	1078	59	103	2026-06-03 12:31:54.090754
1389	3	3	1079	59	45	2026-06-03 12:31:54.092596
1390	3	3	1080	59	136	2026-06-03 12:31:54.094809
1391	3	3	1081	59	88	2026-06-03 12:31:54.096791
1392	3	3	1082	59	135	2026-06-03 12:31:54.098757
1393	3	3	1083	59	23	2026-06-03 12:31:54.100751
1394	3	3	1084	59	5	2026-06-03 12:31:54.102746
1395	3	3	1085	59	40	2026-06-03 12:31:54.104992
1396	3	3	1086	59	20	2026-06-03 12:31:54.107077
1397	3	3	1087	59	95	2026-06-03 12:31:54.108969
1398	3	3	1088	59	8	2026-06-03 12:31:54.110992
1399	3	3	1089	59	9	2026-06-03 12:31:54.113004
1400	3	3	1090	59	19	2026-06-03 12:31:54.114931
1401	3	3	1091	59	46	2026-06-03 12:31:54.116945
1402	3	3	1092	59	120	2026-06-03 12:31:54.118902
1403	3	3	1093	59	39	2026-06-03 12:31:54.121106
1404	3	3	1094	59	33	2026-06-03 12:31:54.123209
1405	3	3	1095	59	22	2026-06-03 12:31:54.125128
1406	3	3	1096	59	37	2026-06-03 12:31:54.127041
1407	3	3	1097	59	22	2026-06-03 12:31:54.12912
1408	3	3	1098	59	276	2026-06-03 12:31:54.130882
1409	3	3	1099	59	88	2026-06-03 12:31:54.132955
1410	3	3	1100	59	588	2026-06-03 12:31:54.134968
1411	3	3	1101	59	74	2026-06-03 12:31:54.137176
1412	3	3	1102	59	512	2026-06-03 12:31:54.139354
1413	3	3	1103	59	63	2026-06-03 12:31:54.141337
1414	3	3	1104	59	39	2026-06-03 12:31:54.143284
1415	3	3	1105	59	10	2026-06-03 12:31:54.145581
1416	3	3	1106	59	63	2026-06-03 12:31:54.147709
1417	3	3	1107	59	26	2026-06-03 12:31:54.150148
1418	3	3	1108	59	23	2026-06-03 12:31:54.152228
1419	3	3	1109	59	17	2026-06-03 12:31:54.154659
1420	3	3	1110	59	32	2026-06-03 12:31:54.156703
1421	3	3	1111	59	75	2026-06-03 12:31:54.158614
1422	3	3	1112	59	118	2026-06-03 12:31:54.160571
1423	3	3	1113	59	32	2026-06-03 12:31:54.16278
1424	3	3	1114	59	46	2026-06-03 12:31:54.164766
1425	3	3	1115	59	80	2026-06-03 12:31:54.1669
1426	3	3	1116	59	37	2026-06-03 12:31:54.168894
1427	3	3	1117	59	31	2026-06-03 12:31:54.171205
1428	3	3	1118	59	17	2026-06-03 12:31:54.173349
1429	3	3	1119	59	756	2026-06-03 12:31:54.175276
1430	3	3	1120	59	33	2026-06-03 12:31:54.177233
1431	3	3	1121	59	921	2026-06-03 12:31:54.179373
1432	3	3	1122	59	94	2026-06-03 12:31:54.181329
1433	3	3	1123	59	228	2026-06-03 12:31:54.18355
1434	3	3	1124	59	65	2026-06-03 12:31:54.1855
1435	3	3	1125	59	192	2026-06-03 12:31:54.187845
1436	3	3	1126	59	104	2026-06-03 12:31:54.190318
1437	3	3	1127	59	324	2026-06-03 12:31:54.192315
1438	3	3	1128	59	11	2026-06-03 12:31:54.194178
1439	3	3	1129	59	26	2026-06-03 12:31:54.19607
1440	3	3	1130	59	6	2026-06-03 12:31:54.19795
1441	3	3	1131	59	13	2026-06-03 12:31:54.199922
1442	3	3	1132	59	7	2026-06-03 12:31:54.201922
1443	3	3	1133	59	8	2026-06-03 12:31:54.204138
1444	3	3	1134	59	3	2026-06-03 12:31:54.206511
1445	3	3	1135	59	5	2026-06-03 12:31:54.208673
1446	3	3	1136	59	11	2026-06-03 12:31:54.210721
1447	3	3	1137	59	11	2026-06-03 12:31:54.212637
1448	3	3	1138	59	7	2026-06-03 12:31:54.214556
1449	3	3	1139	59	6	2026-06-03 12:31:54.21671
1450	3	3	1140	59	1	2026-06-03 12:31:54.218701
1451	3	3	1141	59	14	2026-06-03 12:31:54.221042
1452	3	3	1142	59	7	2026-06-03 12:31:54.223496
1453	3	3	1143	59	1	2026-06-03 12:31:54.225938
1454	3	3	1144	59	10	2026-06-03 12:31:54.227988
1455	3	3	1145	59	1	2026-06-03 12:31:54.230338
1456	3	3	1146	59	7	2026-06-03 12:31:54.232517
1457	3	3	1147	59	13	2026-06-03 12:31:54.23476
1458	3	3	1148	59	5	2026-06-03 12:31:54.236894
1459	3	3	1149	59	2	2026-06-03 12:31:54.239385
1460	3	3	1150	59	5	2026-06-03 12:31:54.241665
1461	3	3	1151	59	6	2026-06-03 12:31:54.243988
1462	3	3	1152	59	11	2026-06-03 12:31:54.24662
1463	3	3	1153	59	96	2026-06-03 12:31:54.248513
1464	3	3	1154	59	8	2026-06-03 12:31:54.250677
1465	3	3	1155	59	7	2026-06-03 12:31:54.252669
1466	3	3	1156	59	1	2026-06-03 12:31:54.255052
1467	3	3	1157	59	11	2026-06-03 12:31:54.257308
1468	3	3	1158	59	5	2026-06-03 12:31:54.259431
1469	3	3	1159	59	7	2026-06-03 12:31:54.261371
1470	3	3	1160	59	5	2026-06-03 12:31:54.263258
1471	3	3	1161	59	4	2026-06-03 12:31:54.265241
1472	3	3	1162	59	1	2026-06-03 12:31:54.267665
1473	3	3	1163	59	3	2026-06-03 12:31:54.270096
1474	3	3	1164	59	8	2026-06-03 12:31:54.272581
1475	3	3	1165	59	1	2026-06-03 12:31:54.274634
1476	3	3	1166	59	5	2026-06-03 12:31:54.276596
1477	3	3	1167	59	8	2026-06-03 12:31:54.278504
1478	3	3	1168	59	15	2026-06-03 12:31:54.2804
1479	3	3	1169	59	6	2026-06-03 12:31:54.282268
1480	3	3	1170	59	11	2026-06-03 12:31:54.284306
1481	3	3	1171	59	11	2026-06-03 12:31:54.28616
1482	3	3	1172	59	11	2026-06-03 12:31:54.288601
1483	3	3	1173	59	5	2026-06-03 12:31:54.29077
1484	3	3	1174	59	11	2026-06-03 12:31:54.292738
1485	3	3	1175	59	5	2026-06-03 12:31:54.29466
1486	3	3	1176	59	9	2026-06-03 12:31:54.296479
1487	3	3	1177	59	7	2026-06-03 12:31:54.298359
1488	3	3	1178	59	13	2026-06-03 12:31:54.300483
1489	3	3	1179	59	11	2026-06-03 12:31:54.302524
1490	3	3	1180	59	9	2026-06-03 12:31:54.30489
1491	3	3	1181	59	9	2026-06-03 12:31:54.307179
1492	3	3	1182	59	12	2026-06-03 12:31:54.30911
1493	3	3	1183	59	6	2026-06-03 12:31:54.311025
1494	3	3	1184	59	3	2026-06-03 12:31:54.312894
1495	3	3	1185	59	1	2026-06-03 12:31:54.314828
1496	3	3	1186	59	1	2026-06-03 12:31:54.316845
1497	3	3	1187	59	16	2026-06-03 12:31:54.318725
1498	3	3	1188	59	6	2026-06-03 12:31:54.320966
1499	3	3	1189	59	18	2026-06-03 12:31:54.323395
1500	3	3	1190	59	5	2026-06-03 12:31:54.325411
1501	3	3	1191	59	1	2026-06-03 12:31:54.327335
1502	3	3	1192	59	6	2026-06-03 12:31:54.329193
1503	3	3	1193	59	1	2026-06-03 12:31:54.331097
1504	3	3	1194	59	9	2026-06-03 12:31:54.333002
1505	3	3	1195	59	7	2026-06-03 12:31:54.335018
1506	3	3	1196	59	14	2026-06-03 12:31:54.337069
1507	3	3	1197	59	2	2026-06-03 12:31:54.339575
1508	3	3	1198	59	53	2026-06-03 12:31:54.341648
1509	3	3	1199	59	8	2026-06-03 12:31:54.343574
1510	3	3	1200	59	3	2026-06-03 12:31:54.345499
1511	3	3	1201	59	1	2026-06-03 12:31:54.347426
1512	3	3	1202	59	10	2026-06-03 12:31:54.349354
1513	3	3	1203	59	8	2026-06-03 12:31:54.35145
1514	3	3	1204	59	4	2026-06-03 12:31:54.353452
1515	3	3	1205	59	8	2026-06-03 12:31:54.355997
1516	3	3	1206	59	1	2026-06-03 12:31:54.358095
1517	3	3	1207	59	8	2026-06-03 12:31:54.360042
1518	3	3	1208	59	3	2026-06-03 12:31:54.361932
1519	3	3	1209	59	4	2026-06-03 12:31:54.363854
1520	3	3	1210	59	7	2026-06-03 12:31:54.365806
1521	3	3	1211	59	89	2026-06-03 12:31:54.367862
1522	3	3	1212	59	58	2026-06-03 12:31:54.369758
1523	3	3	1213	59	5	2026-06-03 12:31:54.372202
1524	3	3	1214	59	8	2026-06-03 12:31:54.374428
1525	3	3	1215	59	12	2026-06-03 12:31:54.376394
1526	3	3	1216	59	5	2026-06-03 12:31:54.378324
1527	3	3	1217	59	10	2026-06-03 12:31:54.380238
1528	3	3	1218	59	10	2026-06-03 12:31:54.382154
1529	3	3	1219	59	8	2026-06-03 12:31:54.384189
1530	3	3	1220	59	12	2026-06-03 12:31:54.386196
1531	3	3	1221	59	6	2026-06-03 12:31:54.388518
1532	3	3	1222	59	89	2026-06-03 12:31:54.39081
1533	3	3	1223	59	5	2026-06-03 12:31:54.392772
1534	3	3	1224	59	5	2026-06-03 12:31:54.3947
1535	3	3	1225	59	23	2026-06-03 12:31:54.396598
1536	3	3	1226	59	9	2026-06-03 12:31:54.398476
1537	3	3	1227	59	2	2026-06-03 12:31:54.400504
1538	3	3	1228	59	7	2026-06-03 12:31:54.402502
1539	3	3	1229	59	3	2026-06-03 12:31:54.40465
1540	3	3	1230	59	1	2026-06-03 12:31:54.407111
1541	3	3	1231	59	5	2026-06-03 12:31:54.409035
1542	3	3	1232	59	6	2026-06-03 12:31:54.411003
1543	3	3	1233	59	7	2026-06-03 12:31:54.412947
1544	3	3	1234	59	105	2026-06-03 12:31:54.414814
1545	3	3	1235	59	2	2026-06-03 12:31:54.416769
1546	3	3	1236	59	9	2026-06-03 12:31:54.418825
1547	3	3	1237	59	4	2026-06-03 12:31:54.420877
1548	3	3	1238	59	49	2026-06-03 12:31:54.423268
1549	3	3	1239	59	5	2026-06-03 12:31:54.425338
1550	3	3	1240	59	1	2026-06-03 12:31:54.427275
1551	3	3	1241	59	5	2026-06-03 12:31:54.429187
1552	3	3	1242	59	4	2026-06-03 12:31:54.431141
1553	3	3	1243	59	4	2026-06-03 12:31:54.433005
1554	3	3	1244	59	8	2026-06-03 12:31:54.435123
1555	3	3	1245	59	10	2026-06-03 12:31:54.437105
1556	3	3	1246	59	13	2026-06-03 12:31:54.439565
1557	3	3	1247	59	8	2026-06-03 12:31:54.441727
1558	3	3	1248	59	60	2026-06-03 12:31:54.4437
1559	3	3	1249	59	3	2026-06-03 12:31:54.445554
1560	3	3	1250	59	9	2026-06-03 12:31:54.447398
1561	3	3	1251	59	20	2026-06-03 12:31:54.449291
1562	3	3	1252	59	78	2026-06-03 12:31:54.451311
1563	3	3	1253	59	49	2026-06-03 12:31:54.453262
1564	3	3	1254	59	3	2026-06-03 12:31:54.455605
1565	3	3	1255	59	6	2026-06-03 12:31:54.457902
1566	3	3	1256	59	3	2026-06-03 12:31:54.459899
1567	3	3	1257	59	4	2026-06-03 12:31:54.461864
1568	3	3	1258	59	21	2026-06-03 12:31:54.46379
1569	3	3	1259	59	10	2026-06-03 12:31:54.465701
1570	3	3	1260	59	5	2026-06-03 12:31:54.46774
1571	3	3	1261	59	4	2026-06-03 12:31:54.469709
1572	3	3	1262	59	7	2026-06-03 12:31:54.472197
1573	3	3	1263	59	3	2026-06-03 12:31:54.474537
1574	3	3	1264	59	1	2026-06-03 12:31:54.476502
1575	3	3	1265	59	2	2026-06-03 12:31:54.478458
1576	3	3	1266	59	4	2026-06-03 12:31:54.480327
1577	3	3	1267	59	7	2026-06-03 12:31:54.482249
1578	3	3	1268	59	9	2026-06-03 12:31:54.484313
1579	3	3	1269	59	13	2026-06-03 12:31:54.486318
1580	3	3	1270	59	9	2026-06-03 12:31:54.48862
1581	3	3	1271	59	4	2026-06-03 12:31:54.490945
1582	3	3	1272	59	7	2026-06-03 12:31:54.492937
1583	3	3	1273	59	5	2026-06-03 12:31:54.494825
1584	3	3	1274	59	12	2026-06-03 12:31:54.496688
1585	3	3	1275	59	7	2026-06-03 12:31:54.498606
1586	3	3	1276	59	7	2026-06-03 12:31:54.500572
1587	3	3	1277	59	6	2026-06-03 12:31:54.502675
1588	3	3	1278	59	1	2026-06-03 12:31:54.504893
1589	3	3	1279	59	11	2026-06-03 12:31:54.507305
1590	3	3	1280	59	7	2026-06-03 12:31:54.509332
1591	3	3	1281	59	5	2026-06-03 12:31:54.511283
1592	3	3	1282	59	11	2026-06-03 12:31:54.513212
1593	3	3	1283	59	5	2026-06-03 12:31:54.515127
1594	3	3	1284	59	14	2026-06-03 12:31:54.517061
1595	3	3	1285	59	9	2026-06-03 12:31:54.519115
1596	3	3	1286	59	5	2026-06-03 12:31:54.521205
1597	3	3	1287	59	6	2026-06-03 12:31:54.523696
1598	3	3	1288	59	1	2026-06-03 12:31:54.525748
1599	3	3	1289	59	15	2026-06-03 12:31:54.527675
1600	3	3	1290	59	7	2026-06-03 12:31:54.529468
1601	3	3	1291	59	2	2026-06-03 12:31:54.531302
1602	3	3	1292	59	154	2026-06-03 12:31:54.533153
1603	3	3	1293	59	10	2026-06-03 12:31:54.535187
1604	3	3	1294	59	1	2026-06-03 12:31:54.537181
1605	3	3	1295	59	10	2026-06-03 12:31:54.539593
1606	3	3	1296	59	1	2026-06-03 12:31:54.541793
1607	3	3	1297	59	7	2026-06-03 12:31:54.543673
1608	3	3	1298	59	10	2026-06-03 12:31:54.545583
1609	3	3	1299	59	3	2026-06-03 12:31:54.54749
1610	3	3	1300	59	4	2026-06-03 12:31:54.549391
1611	3	3	1301	59	7	2026-06-03 12:31:54.551454
1612	3	3	1302	59	3	2026-06-03 12:31:54.553449
1613	3	3	1303	59	5	2026-06-03 12:31:54.555809
1614	3	3	1304	59	11	2026-06-03 12:31:54.558194
1615	3	3	1305	59	9	2026-06-03 12:31:54.560187
1616	3	3	1306	59	5	2026-06-03 12:31:54.562175
1617	3	3	1307	59	3	2026-06-03 12:31:54.564087
1618	3	3	1308	59	8	2026-06-03 12:31:54.566061
1619	3	3	1309	59	11	2026-06-03 12:31:54.56834
1620	3	3	1310	59	5	2026-06-03 12:31:54.570376
1621	3	3	1311	59	9	2026-06-03 12:31:54.572752
1622	3	3	1312	59	13	2026-06-03 12:31:54.575022
1623	3	3	1313	59	8	2026-06-03 12:31:54.576976
1624	3	3	1314	59	4	2026-06-03 12:31:54.578916
1625	3	3	1315	59	11	2026-06-03 12:31:54.580836
1626	3	3	1316	59	19	2026-06-03 12:31:54.582718
1627	3	3	1317	59	8	2026-06-03 12:31:54.584705
1628	3	3	1318	59	11	2026-06-03 12:31:54.586624
1629	3	3	1319	59	9	2026-06-03 12:31:54.588801
1630	3	3	1320	59	12	2026-06-03 12:31:54.5912
1631	3	3	1321	59	4	2026-06-03 12:31:54.593182
1632	3	3	1322	59	17	2026-06-03 12:31:54.595131
1633	3	3	1323	59	11	2026-06-03 12:31:54.59699
1634	3	3	1324	59	14	2026-06-03 12:31:54.598859
1635	3	3	1325	59	3	2026-06-03 12:31:54.600854
1636	3	3	1326	59	4	2026-06-03 12:31:54.602888
1637	3	3	1327	59	9	2026-06-03 12:31:54.605052
1638	3	3	1328	59	4	2026-06-03 12:31:54.607507
1639	3	3	1329	59	9	2026-06-03 12:31:54.609558
1640	3	3	1330	59	2	2026-06-03 12:31:54.611518
1641	3	3	1331	59	10	2026-06-03 12:31:54.613415
1642	3	3	1332	59	4	2026-06-03 12:31:54.615311
1643	3	3	1333	59	21	2026-06-03 12:31:54.617235
1644	3	3	1334	59	7	2026-06-03 12:31:54.619276
1645	3	3	1335	59	4	2026-06-03 12:31:54.621256
1646	3	3	1336	59	5	2026-06-03 12:31:54.623706
1647	3	3	1337	59	1	2026-06-03 12:31:54.625764
1648	3	3	1338	59	8	2026-06-03 12:31:54.627645
1649	3	3	1339	59	4	2026-06-03 12:31:54.629481
1650	3	3	1340	59	8	2026-06-03 12:31:54.631323
1651	3	3	1341	59	6	2026-06-03 12:31:54.633225
1652	3	3	1342	59	3	2026-06-03 12:31:54.63528
1653	3	3	1343	59	30	2026-06-03 12:31:54.637199
1654	3	3	1344	59	4	2026-06-03 12:31:54.639445
1655	3	3	1345	59	8	2026-06-03 12:31:54.641801
1656	3	3	1346	59	1	2026-06-03 12:31:54.644098
1657	3	3	1347	59	4	2026-06-03 12:31:54.646253
1658	3	3	1348	59	8	2026-06-03 12:31:54.648346
1659	3	3	1349	59	11	2026-06-03 12:31:54.650901
1660	3	3	1350	59	3	2026-06-03 12:31:54.653149
1661	3	3	1351	59	4	2026-06-03 12:31:54.655389
1662	3	3	1352	59	5	2026-06-03 12:31:54.657906
1663	3	3	1353	59	63	2026-06-03 12:31:54.659915
1664	3	3	1354	59	5	2026-06-03 12:31:54.661848
1665	3	3	1355	59	3	2026-06-03 12:31:54.663797
1666	3	3	1356	59	4	2026-06-03 12:31:54.665629
1667	3	3	1357	59	7	2026-06-03 12:31:54.667594
1668	3	3	1358	59	6	2026-06-03 12:31:54.669595
1669	3	3	1359	59	10	2026-06-03 12:31:54.671526
1670	3	3	1360	59	6	2026-06-03 12:31:54.67405
1671	3	3	1361	59	16	2026-06-03 12:31:54.676164
1672	3	3	1362	59	1	2026-06-03 12:31:54.678123
1673	3	3	1363	59	5	2026-06-03 12:31:54.680027
1674	3	3	1364	59	7	2026-06-03 12:31:54.681897
1675	3	3	1365	59	8	2026-06-03 12:31:54.683833
1676	3	3	1366	59	15	2026-06-03 12:31:54.685879
1677	3	3	1367	59	2	2026-06-03 12:31:54.687926
1678	3	3	1368	59	9	2026-06-03 12:31:54.690478
1679	3	3	1369	59	8	2026-06-03 12:31:54.692712
1680	3	3	1370	59	13	2026-06-03 12:31:54.694687
1681	3	3	1371	59	5	2026-06-03 12:31:54.696702
1682	3	3	1372	59	10	2026-06-03 12:31:54.698605
1683	3	3	1373	59	6	2026-06-03 12:31:54.70081
1684	3	3	1374	59	7	2026-06-03 12:31:54.702937
1685	3	3	1375	59	33	2026-06-03 12:31:54.704979
1686	3	3	1376	59	70	2026-06-03 12:31:54.707493
1687	3	3	1377	59	67	2026-06-03 12:31:54.709608
1688	3	3	1378	59	5	2026-06-03 12:31:54.711589
1689	3	3	1379	59	4	2026-06-03 12:31:54.713436
1690	3	3	1380	59	10	2026-06-03 12:31:54.715313
1691	3	3	1381	59	9	2026-06-03 12:31:54.717214
1692	3	3	1382	59	47	2026-06-03 12:31:54.719231
1693	3	3	1383	59	10	2026-06-03 12:31:54.721218
1694	3	3	1384	59	7	2026-06-03 12:31:54.723708
1695	3	3	1385	59	11	2026-06-03 12:31:54.725907
1696	3	3	1386	59	4	2026-06-03 12:31:54.727882
1697	3	3	1387	59	12	2026-06-03 12:31:54.7298
1698	3	3	1388	59	8	2026-06-03 12:31:54.731777
1699	3	3	1389	59	1	2026-06-03 12:31:54.733679
1700	3	3	1390	59	3	2026-06-03 12:31:54.735738
1701	3	3	1391	59	18	2026-06-03 12:31:54.737659
1702	3	3	1392	59	12	2026-06-03 12:31:54.739979
1703	3	3	1393	59	18	2026-06-03 12:31:54.742207
1704	3	3	1394	59	9	2026-06-03 12:31:54.744096
1705	3	3	1395	59	5	2026-06-03 12:31:54.745962
1706	3	3	1396	59	12	2026-06-03 12:31:54.747866
1707	3	3	1397	59	6	2026-06-03 12:31:54.749802
1708	3	3	1398	59	7	2026-06-03 12:31:54.751918
1709	3	3	1399	59	5	2026-06-03 12:31:54.753892
1710	3	3	1400	59	2	2026-06-03 12:31:54.75629
1711	3	3	1401	59	12	2026-06-03 12:31:54.758665
1712	3	3	1402	59	7	2026-06-03 12:31:54.760694
1713	3	3	1403	59	1	2026-06-03 12:31:54.762673
1714	3	3	1404	59	5	2026-06-03 12:31:54.764597
1715	3	3	1405	59	1	2026-06-03 12:31:54.766487
1716	3	3	1406	59	7	2026-06-03 12:31:54.768484
1717	3	3	1407	59	14	2026-06-03 12:31:54.770511
1718	3	3	1408	59	9	2026-06-03 12:31:54.772749
1719	3	3	1409	59	2	2026-06-03 12:31:54.775182
1720	3	3	1410	59	10	2026-06-03 12:31:54.777207
1721	3	3	1411	59	4	2026-06-03 12:31:54.779161
1722	3	3	1412	59	5	2026-06-03 12:31:54.78103
1723	3	3	1413	59	9	2026-06-03 12:31:54.782986
1724	3	3	1414	59	5	2026-06-03 12:31:54.785064
1725	3	3	1415	59	6	2026-06-03 12:31:54.787056
1726	3	3	1416	59	77	2026-06-03 12:31:54.789239
1727	3	3	1417	59	20	2026-06-03 12:31:54.791691
1728	3	3	1418	59	8	2026-06-03 12:31:54.793696
1729	3	3	1419	59	7	2026-06-03 12:31:54.795673
1730	3	3	1420	59	10	2026-06-03 12:31:54.797564
1731	3	3	1421	59	9	2026-06-03 12:31:54.799435
1732	3	3	1422	59	4	2026-06-03 12:31:54.801437
1733	3	3	1423	59	5	2026-06-03 12:31:54.803508
1734	3	3	1424	59	6	2026-06-03 12:31:54.805592
1735	3	3	1425	59	74	2026-06-03 12:31:54.808109
1736	3	3	1426	59	4	2026-06-03 12:31:54.810039
1737	3	3	1427	59	6	2026-06-03 12:31:54.811992
1738	3	3	1428	59	7	2026-06-03 12:31:54.81395
1739	3	3	1429	59	53	2026-06-03 12:31:54.815874
1740	3	3	1430	59	7	2026-06-03 12:31:54.81785
1741	3	3	1431	59	9	2026-06-03 12:31:54.819864
1742	3	3	1432	59	5	2026-06-03 12:31:54.821881
1743	3	3	1433	59	4	2026-06-03 12:31:54.824307
1744	3	3	1434	59	5	2026-06-03 12:31:54.826447
1745	3	3	1435	59	3	2026-06-03 12:31:54.828396
1746	3	3	1436	59	4	2026-06-03 12:31:54.830336
1747	3	3	1437	59	4	2026-06-03 12:31:54.832275
1748	3	3	1438	59	9	2026-06-03 12:31:54.834128
1749	3	3	1439	59	15	2026-06-03 12:31:54.836294
1750	3	3	1440	59	9	2026-06-03 12:31:54.83825
1751	3	3	1441	59	7	2026-06-03 12:31:54.840798
1752	3	3	1442	59	8	2026-06-03 12:31:54.842991
1753	3	3	1443	59	1	2026-06-03 12:31:54.844972
1754	3	3	1444	59	3	2026-06-03 12:31:54.846937
1755	3	3	1445	59	8	2026-06-03 12:31:54.848903
1756	3	3	1446	59	10	2026-06-03 12:31:54.850875
1757	3	3	1447	59	5	2026-06-03 12:31:54.853063
1758	3	3	1448	59	2	2026-06-03 12:31:54.855099
1759	3	3	1449	59	12	2026-06-03 12:31:54.857604
1760	3	3	1450	59	14	2026-06-03 12:31:54.859872
1761	3	3	1451	59	7	2026-06-03 12:31:54.861879
1762	3	3	1452	59	5	2026-06-03 12:31:54.863844
1763	3	3	1453	59	4	2026-06-03 12:31:54.865786
1764	3	3	1454	59	8	2026-06-03 12:31:54.86771
1765	3	3	1455	59	4	2026-06-03 12:31:54.869923
1766	3	3	1456	59	4	2026-06-03 12:31:54.871924
1767	3	3	1457	59	4	2026-06-03 12:31:54.874455
1768	3	3	1458	59	4	2026-06-03 12:31:54.876601
1769	3	3	1459	59	6	2026-06-03 12:31:54.878639
1770	3	3	1460	59	3	2026-06-03 12:31:54.880591
1771	3	3	1461	59	10	2026-06-03 12:31:54.882495
1772	3	3	1462	59	10	2026-06-03 12:31:54.884442
1773	3	3	1463	59	4	2026-06-03 12:31:54.88664
1774	3	3	1464	59	4	2026-06-03 12:31:54.888633
1775	3	3	1465	59	15	2026-06-03 12:31:54.891168
1776	3	3	1466	59	7	2026-06-03 12:31:54.893345
1777	3	3	1467	59	45	2026-06-03 12:31:54.895338
1778	3	3	1468	59	16	2026-06-03 12:31:54.897278
1779	3	3	1469	59	7	2026-06-03 12:31:54.899204
1780	3	3	1470	59	1	2026-06-03 12:31:54.901145
1781	3	3	1471	59	7	2026-06-03 12:31:54.903337
1782	3	3	1472	59	1	2026-06-03 12:31:54.905426
1783	3	3	1473	59	7	2026-06-03 12:31:54.907978
1784	3	3	1474	59	5	2026-06-03 12:31:54.910155
1785	3	3	1475	59	1	2026-06-03 12:31:54.912164
1786	3	3	1476	59	7	2026-06-03 12:31:54.914105
1787	3	3	1477	59	4	2026-06-03 12:31:54.915994
1788	3	3	1478	59	6	2026-06-03 12:31:54.917873
1789	3	3	1479	59	2	2026-06-03 12:31:54.920188
1790	3	3	1480	59	14	2026-06-03 12:31:54.922322
1791	3	3	1481	59	5	2026-06-03 12:31:54.924864
1792	3	3	1482	59	4	2026-06-03 12:31:54.926982
1793	3	3	1483	59	3	2026-06-03 12:31:54.928961
1794	3	3	1484	59	8	2026-06-03 12:31:54.930915
1795	3	3	1485	59	4	2026-06-03 12:31:54.932873
1796	3	3	1486	59	7	2026-06-03 12:31:54.934837
1797	3	3	1487	59	12	2026-06-03 12:31:54.93692
1798	3	3	1488	59	39	2026-06-03 12:31:54.939014
1799	3	3	1489	59	5	2026-06-03 12:31:54.941516
1800	3	3	1490	59	11	2026-06-03 12:31:54.943689
1801	3	3	1491	59	5	2026-06-03 12:31:54.945679
1802	3	3	1492	59	10	2026-06-03 12:31:54.947635
1803	3	3	1493	59	7	2026-06-03 12:31:54.949521
1804	3	3	1494	59	7	2026-06-03 12:31:54.951495
1805	3	3	1495	59	7	2026-06-03 12:31:54.95364
1806	3	3	1496	59	66	2026-06-03 12:31:54.955767
1807	3	3	1497	59	1	2026-06-03 12:31:54.958322
1808	3	3	1498	59	3	2026-06-03 12:31:54.960439
1809	3	3	1499	59	9	2026-06-03 12:31:54.961785
1810	3	3	1500	59	7	2026-06-03 12:31:54.965614
1811	3	3	1501	59	19	2026-06-03 12:31:54.96757
1812	3	3	1502	59	10	2026-06-03 12:31:54.969733
1813	3	3	1503	59	5	2026-06-03 12:31:54.971886
1814	3	3	1504	59	5	2026-06-03 12:31:54.974436
1815	3	3	1505	59	6	2026-06-03 12:31:54.976672
1816	3	3	1506	59	1	2026-06-03 12:31:54.978715
1817	3	3	1507	59	10	2026-06-03 12:31:54.98087
1818	3	3	1508	59	8	2026-06-03 12:31:54.982876
1819	3	3	1509	59	1	2026-06-03 12:31:54.984822
1820	3	3	1510	59	12	2026-06-03 12:31:54.987012
1821	3	3	1511	59	1	2026-06-03 12:31:54.989052
1822	3	3	1512	59	5	2026-06-03 12:31:54.991549
1823	3	3	1513	59	9	2026-06-03 12:31:54.993756
1824	3	3	1514	59	8	2026-06-03 12:31:54.995772
1825	3	3	1515	59	3	2026-06-03 12:31:54.997695
1826	3	3	1516	59	14	2026-06-03 12:31:54.999642
1827	3	3	1517	59	1	2026-06-03 12:31:55.001571
1828	3	3	1518	59	2	2026-06-03 12:31:55.003705
1829	3	3	1519	59	6	2026-06-03 12:31:55.005743
1830	3	3	1520	59	6	2026-06-03 12:31:55.008125
1831	3	3	1521	59	1	2026-06-03 12:31:55.010237
1832	3	3	1522	59	16	2026-06-03 12:31:55.012363
1833	3	3	1523	59	5	2026-06-03 12:31:55.014327
1834	3	3	1524	59	5	2026-06-03 12:31:55.016277
1835	3	3	1525	59	7	2026-06-03 12:31:55.018236
1836	3	3	1526	59	10	2026-06-03 12:31:55.020406
1837	3	3	1527	59	7	2026-06-03 12:31:55.02268
1838	3	3	1528	59	8	2026-06-03 12:31:55.025257
1839	3	3	1529	59	10	2026-06-03 12:31:55.027399
1840	3	3	1530	59	9	2026-06-03 12:31:55.029414
1841	3	3	1531	59	89	2026-06-03 12:31:55.03136
1842	3	3	1532	59	4	2026-06-03 12:31:55.033291
1843	3	3	1533	59	11	2026-06-03 12:31:55.03524
1844	3	3	1534	59	8	2026-06-03 12:31:55.037436
1845	3	3	1535	59	4	2026-06-03 12:31:55.039547
1846	3	3	1536	59	50	2026-06-03 12:31:55.042085
1847	3	3	1537	59	7	2026-06-03 12:31:55.044284
1848	3	3	1538	59	31	2026-06-03 12:31:55.046275
1849	3	3	1539	59	6	2026-06-03 12:31:55.048219
1850	3	3	1540	59	8	2026-06-03 12:31:55.050138
1851	3	3	1541	59	6	2026-06-03 12:31:55.052065
1852	3	3	1542	59	8	2026-06-03 12:31:55.054247
1853	3	3	1543	59	18	2026-06-03 12:31:55.056373
1854	3	3	1544	59	7	2026-06-03 12:31:55.058914
1855	3	3	1545	59	9	2026-06-03 12:31:55.061658
1856	3	3	1546	59	7	2026-06-03 12:31:55.063701
1857	3	3	1547	59	2	2026-06-03 12:31:55.065664
1858	3	3	1548	59	2	2026-06-03 12:31:55.067621
1859	3	3	1549	59	8	2026-06-03 12:31:55.069741
1860	3	3	1550	59	4	2026-06-03 12:31:55.071799
1861	3	3	1551	59	28	2026-06-03 12:31:55.074235
1862	3	3	1552	59	14	2026-06-03 12:31:55.07661
1863	3	3	1553	59	45	2026-06-03 12:31:55.078581
1864	3	3	1554	59	8	2026-06-03 12:31:55.080588
1865	3	3	1555	59	4	2026-06-03 12:31:55.082541
1866	3	3	1556	59	2	2026-06-03 12:31:55.084491
1867	3	3	1557	59	13	2026-06-03 12:31:55.086513
1868	3	3	1558	59	63	2026-06-03 12:31:55.088539
1869	3	3	1559	59	16	2026-06-03 12:31:55.090911
1870	3	3	1560	59	1	2026-06-03 12:31:55.093292
1871	3	3	1561	59	14	2026-06-03 12:31:55.095348
1872	3	3	1562	59	12	2026-06-03 12:31:55.097326
1873	3	3	1563	59	4	2026-06-03 12:31:55.099274
1874	3	3	1564	59	13	2026-06-03 12:31:55.101246
1875	3	3	1565	59	5	2026-06-03 12:31:55.103408
1876	3	3	1566	59	3	2026-06-03 12:31:55.105371
1877	3	3	1567	59	3	2026-06-03 12:31:55.107785
1878	3	3	1568	59	1	2026-06-03 12:31:55.110109
1879	3	3	1569	59	79	2026-06-03 12:31:55.112056
1880	3	3	1570	59	3	2026-06-03 12:31:55.113995
1881	3	3	1571	59	7	2026-06-03 12:31:55.115962
1882	3	3	1572	59	2	2026-06-03 12:31:55.11793
1883	3	3	1573	59	15	2026-06-03 12:31:55.12007
1884	3	3	1574	59	8	2026-06-03 12:31:55.122122
1885	3	3	1575	59	13	2026-06-03 12:31:55.124458
1886	3	3	1576	59	3	2026-06-03 12:31:55.12682
1887	3	3	1577	59	18	2026-06-03 12:31:55.128841
1888	3	3	1578	59	10	2026-06-03 12:31:55.130786
1889	3	3	1579	59	1	2026-06-03 12:31:55.132746
1890	3	3	1580	59	11	2026-06-03 12:31:55.134652
1891	3	3	1581	59	10	2026-06-03 12:31:55.136654
1892	3	3	1582	59	10	2026-06-03 12:31:55.138745
1893	3	3	1583	59	19	2026-06-03 12:31:55.141228
1894	3	3	1584	59	6	2026-06-03 12:31:55.143569
1895	3	3	1585	59	10	2026-06-03 12:31:55.145776
1896	3	3	1586	59	10	2026-06-03 12:31:55.147956
1897	3	3	1587	59	5	2026-06-03 12:31:55.19117
1898	3	3	1588	59	7	2026-06-03 12:31:55.193602
1899	3	3	1589	59	18	2026-06-03 12:31:55.195606
1900	3	3	1590	59	20	2026-06-03 12:31:55.197521
1901	3	3	1591	59	12	2026-06-03 12:31:55.199873
1902	3	3	1592	59	14	2026-06-03 12:31:55.203968
1903	3	3	1593	59	2	2026-06-03 12:31:55.20604
1904	3	3	1594	59	10	2026-06-03 12:31:55.20855
1905	3	3	1595	59	5	2026-06-03 12:31:55.210837
1906	3	3	1596	59	6	2026-06-03 12:31:55.212897
1907	3	3	1597	59	7	2026-06-03 12:31:55.214866
1908	3	3	1598	59	4	2026-06-03 12:31:55.216825
1909	3	3	1599	59	8	2026-06-03 12:31:55.218735
1910	3	3	1600	59	54	2026-06-03 12:31:55.220988
1911	3	3	1601	59	12	2026-06-03 12:31:55.223198
1912	3	3	1602	59	3	2026-06-03 12:31:55.225751
1913	3	3	1603	59	11	2026-06-03 12:31:55.228024
1914	3	3	1604	59	12	2026-06-03 12:31:55.230034
1915	3	3	1605	59	104	2026-06-03 12:31:55.232012
1916	3	3	1606	59	1	2026-06-03 12:31:55.234003
1917	3	3	1607	59	12	2026-06-03 12:31:55.235909
1918	3	3	1608	59	8	2026-06-03 12:31:55.238044
1919	3	3	1609	59	7	2026-06-03 12:31:55.240233
1920	3	3	1610	59	5	2026-06-03 12:31:55.242797
1921	3	3	1611	59	2	2026-06-03 12:31:55.245109
1922	3	3	1612	59	1	2026-06-03 12:31:55.247116
1923	3	3	1613	59	2	2026-06-03 12:31:55.249048
1924	3	3	1614	59	51	2026-06-03 12:31:55.250946
1925	3	3	1615	59	3	2026-06-03 12:31:55.252909
1926	3	3	1616	59	9	2026-06-03 12:31:55.255041
1927	3	3	1617	59	9	2026-06-03 12:31:55.257497
1928	3	3	1618	59	10	2026-06-03 12:31:55.260127
1929	3	3	1619	59	13	2026-06-03 12:31:55.262206
1930	3	3	1620	59	4	2026-06-03 12:31:55.264154
1931	3	3	1621	59	31	2026-06-03 12:31:55.266104
1932	3	3	1622	59	12	2026-06-03 12:31:55.268488
1933	3	3	1623	59	1	2026-06-03 12:31:55.270738
1934	3	3	1624	59	7	2026-06-03 12:31:55.272804
1935	3	3	1625	59	1	2026-06-03 12:31:55.274324
1936	3	3	1626	59	1	2026-06-03 12:31:55.278072
1937	3	3	1627	59	22	2026-06-03 12:31:55.280108
1938	3	3	1628	53	95	2026-06-03 12:31:55.282076
1939	3	3	1629	53	70	2026-06-03 12:31:55.284046
1940	3	3	1630	53	48	2026-06-03 12:31:55.285984
1941	3	3	1631	53	65	2026-06-03 12:31:55.288045
1942	3	3	1632	53	65	2026-06-03 12:31:55.290077
1943	3	3	1633	53	28	2026-06-03 12:31:55.292739
1944	3	3	1634	53	19	2026-06-03 12:31:55.29488
1945	3	3	1635	53	67	2026-06-03 12:31:55.296854
1946	3	3	1636	53	53	2026-06-03 12:31:55.298782
1947	3	3	1637	53	109	2026-06-03 12:31:55.300749
1948	3	3	1638	53	416	2026-06-03 12:31:55.302702
1949	3	3	1639	53	232	2026-06-03 12:31:55.30483
1950	3	3	1640	53	93	2026-06-03 12:31:55.306958
1951	3	3	1641	53	17	2026-06-03 12:31:55.309617
1952	3	3	1642	53	66	2026-06-03 12:31:55.311803
1953	3	3	1643	53	42	2026-06-03 12:31:55.313836
1954	3	3	1644	53	51	2026-06-03 12:31:55.315778
1955	3	3	1645	53	432	2026-06-03 12:31:55.317745
1956	3	3	1646	53	19	2026-06-03 12:31:55.319752
1957	3	3	1647	53	35	2026-06-03 12:31:55.32193
1958	3	3	1648	53	41	2026-06-03 12:31:55.324099
1959	3	3	1649	53	67	2026-06-03 12:31:55.32674
1960	3	3	1650	53	14	2026-06-03 12:31:55.328861
1961	3	3	1651	53	91	2026-06-03 12:31:55.330842
1962	3	3	1652	53	44	2026-06-03 12:31:55.332809
1963	3	3	1653	53	620	2026-06-03 12:31:55.334788
1964	3	3	1654	53	22	2026-06-03 12:31:55.336744
1965	3	3	1655	53	54	2026-06-03 12:31:55.338846
1966	3	3	1656	53	416	2026-06-03 12:31:55.341143
1967	3	3	1657	53	38	2026-06-03 12:31:55.343703
1968	3	3	1658	53	57	2026-06-03 12:31:55.345792
1969	3	3	1659	53	782	2026-06-03 12:31:55.347786
1970	3	3	1660	53	101	2026-06-03 12:31:55.34973
1971	3	3	1661	53	85	2026-06-03 12:31:55.351798
1972	3	3	1662	53	141	2026-06-03 12:31:55.35393
1973	3	3	1663	53	76	2026-06-03 12:31:55.356157
1974	3	3	1664	53	5	2026-06-03 12:31:55.358729
1975	3	3	1665	53	73	2026-06-03 12:31:55.361237
1976	3	3	1666	53	40	2026-06-03 12:31:55.363414
1977	3	3	1667	53	58	2026-06-03 12:31:55.365589
1978	3	3	1668	53	105	2026-06-03 12:31:55.367759
1979	3	3	1669	53	50	2026-06-03 12:31:55.369871
1980	3	3	1670	53	46	2026-06-03 12:31:55.372269
1981	3	3	1671	53	12	2026-06-03 12:31:55.374606
1982	3	3	1672	53	58	2026-06-03 12:31:55.377268
1983	3	3	1673	53	25	2026-06-03 12:31:55.379481
1984	3	3	1674	53	139	2026-06-03 12:31:55.381634
1985	3	3	1675	53	52	2026-06-03 12:31:55.383756
1986	3	3	1676	53	48	2026-06-03 12:31:55.385853
1987	3	3	1677	53	34	2026-06-03 12:31:55.388203
1988	3	3	1678	53	18	2026-06-03 12:31:55.390468
1989	3	3	1679	53	29	2026-06-03 12:31:55.393228
1990	3	3	1680	53	64	2026-06-03 12:31:55.39554
1991	3	3	1681	53	90	2026-06-03 12:31:55.397709
1992	3	3	1682	53	50	2026-06-03 12:31:55.40006
1993	3	3	1683	53	93	2026-06-03 12:31:55.402414
1994	3	3	1684	53	70	2026-06-03 12:31:55.404733
1995	3	3	1685	53	78	2026-06-03 12:31:55.406967
1996	3	3	1686	53	58	2026-06-03 12:31:55.409705
1997	3	3	1687	53	61	2026-06-03 12:31:55.412053
1998	3	3	1688	53	48	2026-06-03 12:31:55.414191
1999	3	3	1689	53	25	2026-06-03 12:31:55.416297
2000	3	3	1690	53	48	2026-06-03 12:31:55.418408
2001	3	3	1691	53	102	2026-06-03 12:31:55.420585
2002	3	3	1692	53	78	2026-06-03 12:31:55.422868
2003	3	3	1693	53	265	2026-06-03 12:31:55.42544
2004	3	3	1694	59	619	2026-06-03 12:31:55.428074
2005	3	3	1695	59	24	2026-06-03 12:31:55.430253
2006	3	3	1696	59	95	2026-06-03 12:31:55.432394
2007	3	3	1697	59	64	2026-06-03 12:31:55.434513
2008	3	3	1698	59	90	2026-06-03 12:31:55.436614
2009	3	3	1699	59	225	2026-06-03 12:31:55.438925
2010	3	3	1700	59	132	2026-06-03 12:31:55.44123
2011	3	3	1701	59	28	2026-06-03 12:31:55.443985
2012	3	3	1702	59	24	2026-06-03 12:31:55.446261
2013	3	3	1703	59	135	2026-06-03 12:31:55.448427
2014	3	3	1704	59	566	2026-06-03 12:31:55.450538
2015	3	3	1705	59	25	2026-06-03 12:31:55.452677
2016	3	3	1706	59	43	2026-06-03 12:31:55.454917
2017	3	3	1707	59	113	2026-06-03 12:31:55.457163
2018	3	3	1708	59	49	2026-06-03 12:31:55.459874
2019	3	3	1709	59	30	2026-06-03 12:31:55.462263
2020	3	3	1710	59	78	2026-06-03 12:31:55.46448
2021	3	3	1711	59	75	2026-06-03 12:31:55.466601
2022	3	3	1712	59	33	2026-06-03 12:31:55.468679
2023	3	3	1713	59	15	2026-06-03 12:31:55.470828
2024	3	3	1714	59	132	2026-06-03 12:31:55.473134
2025	3	3	1715	59	80	2026-06-03 12:31:55.475741
2026	3	3	1716	59	694	2026-06-03 12:31:55.478263
2027	3	3	1717	59	26	2026-06-03 12:31:55.480493
2028	3	3	1718	59	280	2026-06-03 12:31:55.482484
2029	3	3	1719	59	32	2026-06-03 12:31:55.484501
2030	3	3	1720	59	72	2026-06-03 12:31:55.486613
2031	3	3	1721	59	171	2026-06-03 12:31:55.488892
2032	3	3	1722	59	118	2026-06-03 12:31:55.491196
2033	3	3	1723	59	44	2026-06-03 12:31:55.493917
2034	3	3	1724	59	873	2026-06-03 12:31:55.496093
2035	3	3	1725	59	56	2026-06-03 12:31:55.498178
2036	3	3	1726	59	133	2026-06-03 12:31:55.500129
2037	3	3	1727	59	77	2026-06-03 12:31:55.502084
2038	3	3	1728	59	21	2026-06-03 12:31:55.503943
2039	3	3	1729	59	2	2026-06-03 12:31:55.506096
2040	3	3	1730	59	26	2026-06-03 12:31:55.508307
2041	3	3	1731	59	94	2026-06-03 12:31:55.510894
2042	3	3	1732	59	68	2026-06-03 12:31:55.512957
2043	3	3	1733	59	85	2026-06-03 12:31:55.514874
2044	3	3	1734	59	122	2026-06-03 12:31:55.51686
2045	3	3	1735	59	37	2026-06-03 12:31:55.518801
2046	3	3	1736	59	749	2026-06-03 12:31:55.520781
2047	3	3	1737	59	31	2026-06-03 12:31:55.52304
2048	3	3	1738	59	10	2026-06-03 12:31:55.525387
2049	3	3	1739	59	69	2026-06-03 12:31:55.528215
2050	3	3	1740	59	40	2026-06-03 12:31:55.530353
2051	3	3	1741	59	50	2026-06-03 12:31:55.532373
2052	3	3	1742	59	58	2026-06-03 12:31:55.534322
2053	3	3	1743	59	98	2026-06-03 12:31:55.536286
2054	3	3	1744	59	263	2026-06-03 12:31:55.538387
2055	3	3	1745	59	50	2026-06-03 12:31:55.540501
2056	3	3	1746	59	251	2026-06-03 12:31:55.543024
2057	3	3	1747	59	71	2026-06-03 12:31:55.545278
2058	3	3	1748	59	58	2026-06-03 12:31:55.547352
2059	3	3	1749	59	34	2026-06-03 12:31:55.549391
2060	3	3	1750	59	55	2026-06-03 12:31:55.551359
2061	3	3	1751	59	2	2026-06-03 12:31:55.553372
2062	3	3	1752	59	13	2026-06-03 12:31:55.555486
2063	3	3	1753	59	33	2026-06-03 12:31:55.557612
2064	3	3	1754	59	110	2026-06-03 12:31:55.56048
2065	3	3	1755	59	98	2026-06-03 12:31:55.562668
2066	3	3	1756	59	51	2026-06-03 12:31:55.56466
2067	3	3	1757	59	102	2026-06-03 12:31:55.566613
2068	3	3	1758	59	57	2026-06-03 12:31:55.568563
2069	3	3	1759	59	117	2026-06-03 12:31:55.570488
2070	3	3	1760	59	22	2026-06-03 12:31:55.572591
2071	3	3	1761	59	52	2026-06-03 12:31:55.574628
2072	3	3	1762	59	79	2026-06-03 12:31:55.577238
2073	3	3	1763	59	26	2026-06-03 12:31:55.579383
2074	3	3	1764	59	59	2026-06-03 12:31:55.581407
2075	3	3	1765	59	16	2026-06-03 12:31:55.58341
2076	3	3	1766	59	66	2026-06-03 12:31:55.585409
2077	3	3	1767	59	33	2026-06-03 12:31:55.587512
2078	3	3	1768	59	290	2026-06-03 12:31:55.589671
2079	3	3	1769	59	62	2026-06-03 12:31:55.591865
2080	3	3	1770	59	48	2026-06-03 12:31:55.594477
2081	3	3	1771	59	883	2026-06-03 12:31:55.596532
2082	3	3	1772	59	62	2026-06-03 12:31:55.598556
2083	3	3	1773	59	80	2026-06-03 12:31:55.600545
2084	3	3	1774	59	36	2026-06-03 12:31:55.602505
2085	3	3	1775	59	14	2026-06-03 12:31:55.604577
2086	3	3	1776	59	9	2026-06-03 12:31:55.60666
2087	3	3	1777	59	25	2026-06-03 12:31:55.608974
2088	3	3	1778	59	28	2026-06-03 12:31:55.611507
2089	3	3	1779	59	59	2026-06-03 12:31:55.613537
2090	3	3	1780	59	17	2026-06-03 12:31:55.615445
2091	3	3	1781	59	50	2026-06-03 12:31:55.617424
2092	3	3	1782	59	97	2026-06-03 12:31:55.619414
2093	3	3	1783	59	1025	2026-06-03 12:31:55.621424
2094	3	3	1784	59	32	2026-06-03 12:31:55.623471
2095	3	3	1785	59	19	2026-06-03 12:31:55.625856
2096	3	3	1786	59	89	2026-06-03 12:31:55.628359
2097	3	3	1787	59	81	2026-06-03 12:31:55.630409
2098	3	3	1788	59	53	2026-06-03 12:31:55.632448
2099	3	3	1789	59	46	2026-06-03 12:31:55.63447
2100	3	3	1790	59	239	2026-06-03 12:31:55.636509
2101	3	3	1791	59	31	2026-06-03 12:31:55.638619
2102	3	3	1792	59	26	2026-06-03 12:31:55.640719
2103	3	3	1793	59	86	2026-06-03 12:31:55.643196
2104	3	3	1794	59	21	2026-06-03 12:31:55.645665
2105	3	3	1795	59	71	2026-06-03 12:31:55.647916
2106	3	3	1796	59	72	2026-06-03 12:31:55.650218
2107	3	3	1797	59	807	2026-06-03 12:31:55.652463
2108	3	3	1798	59	143	2026-06-03 12:31:55.654948
2109	3	3	1799	59	45	2026-06-03 12:31:55.657196
2110	3	3	1800	59	71	2026-06-03 12:31:55.659673
2111	3	3	1801	59	86	2026-06-03 12:31:55.662141
2112	3	3	1802	59	1009	2026-06-03 12:31:55.664154
2113	3	3	1803	59	67	2026-06-03 12:31:55.666168
2114	3	3	1804	59	16	2026-06-03 12:31:55.668147
2115	3	3	1805	59	84	2026-06-03 12:31:55.670136
2116	3	3	1806	59	21	2026-06-03 12:31:55.672125
2117	3	3	1807	59	84	2026-06-03 12:31:55.674138
2118	3	3	1808	59	96	2026-06-03 12:31:55.676884
2119	3	3	1809	59	67	2026-06-03 12:31:55.679364
2120	3	3	1810	59	72	2026-06-03 12:31:55.681362
2121	3	3	1811	59	57	2026-06-03 12:31:55.683355
2122	3	3	1812	59	128	2026-06-03 12:31:55.685314
2123	3	3	1813	59	78	2026-06-03 12:31:55.6873
2124	3	3	1814	59	55	2026-06-03 12:31:55.689463
2125	3	3	1815	59	39	2026-06-03 12:31:55.69161
2126	3	3	1816	59	63	2026-06-03 12:31:55.694224
2127	3	3	1817	59	10	2026-06-03 12:31:55.696428
2128	3	3	1818	59	30	2026-06-03 12:31:55.698459
2129	3	3	1819	59	53	2026-06-03 12:31:55.700455
2130	3	3	1820	59	34	2026-06-03 12:31:55.702434
2131	3	3	1821	59	19	2026-06-03 12:31:55.704436
2132	3	3	1822	59	709	2026-06-03 12:31:55.706593
2133	3	3	1823	59	47	2026-06-03 12:31:55.708822
2134	3	3	1824	59	79	2026-06-03 12:31:55.711447
2135	3	3	1825	59	87	2026-06-03 12:31:55.713572
2136	3	3	1826	59	7	2026-06-03 12:31:55.71561
2137	3	3	1827	59	24	2026-06-03 12:31:55.717548
2138	3	3	1828	59	45	2026-06-03 12:31:55.719481
2139	3	3	1829	59	15	2026-06-03 12:31:55.721464
2140	3	3	1830	59	94	2026-06-03 12:31:55.723766
2141	3	3	1831	59	16	2026-06-03 12:31:55.726113
2142	3	3	1832	59	77	2026-06-03 12:31:55.7286
2143	3	3	1833	59	99	2026-06-03 12:31:55.73068
2144	3	3	1834	59	21	2026-06-03 12:31:55.73269
2145	3	3	1835	59	72	2026-06-03 12:31:55.734639
2146	3	3	1836	59	88	2026-06-03 12:31:55.736568
2147	3	3	1837	59	44	2026-06-03 12:31:55.738534
2148	3	3	1838	59	37	2026-06-03 12:31:55.740725
2149	3	3	1839	59	40	2026-06-03 12:31:55.743193
2150	3	3	1840	59	367	2026-06-03 12:31:55.745631
2151	3	3	1841	59	17	2026-06-03 12:31:55.747713
2152	3	3	1842	59	291	2026-06-03 12:31:55.749727
2153	3	3	1843	59	19	2026-06-03 12:31:55.75172
2154	3	3	1844	59	97	2026-06-03 12:31:55.753653
2155	3	3	1845	59	81	2026-06-03 12:31:55.75572
2156	3	3	1846	59	53	2026-06-03 12:31:55.757749
2157	3	3	1847	59	45	2026-06-03 12:31:55.760153
2158	3	3	1848	59	57	2026-06-03 12:31:55.762534
2159	3	3	1849	59	15	2026-06-03 12:31:55.764764
2160	3	3	1850	59	82	2026-06-03 12:31:55.766768
2161	3	3	1851	59	562	2026-06-03 12:31:55.768784
2162	3	3	1852	59	56	2026-06-03 12:31:55.770748
2163	3	3	1853	59	84	2026-06-03 12:31:55.77283
2164	3	3	1854	59	81	2026-06-03 12:31:55.77486
2165	3	3	1855	59	25	2026-06-03 12:31:55.77748
2166	3	3	1856	59	5	2026-06-03 12:31:55.779726
2167	3	3	1857	59	99	2026-06-03 12:31:55.781771
2168	3	3	1858	59	40	2026-06-03 12:31:55.783743
2169	3	3	1859	59	8	2026-06-03 12:31:55.785645
2170	3	3	1860	59	3	2026-06-03 12:31:55.787615
2171	3	3	1861	59	39	2026-06-03 12:31:55.789688
2172	3	3	1862	59	46	2026-06-03 12:31:55.79168
2173	3	3	1863	59	10	2026-06-03 12:31:55.794211
2174	3	3	1864	59	88	2026-06-03 12:31:55.796444
2175	3	3	1865	59	55	2026-06-03 12:31:55.798507
2176	3	3	1866	59	19	2026-06-03 12:31:55.80055
2177	3	3	1867	59	59	2026-06-03 12:31:55.802537
2178	3	3	1868	59	21	2026-06-03 12:31:55.804491
2179	3	3	1869	59	182	2026-06-03 12:31:55.806643
2180	3	3	1870	59	33	2026-06-03 12:31:55.808849
2181	3	3	1871	59	15	2026-06-03 12:31:55.811467
2182	3	3	1872	59	47	2026-06-03 12:31:55.813635
2183	3	3	1873	59	83	2026-06-03 12:31:55.815637
2184	3	3	1874	59	120	2026-06-03 12:31:55.817625
2185	3	3	1875	59	100	2026-06-03 12:31:55.819536
2186	3	3	1876	59	76	2026-06-03 12:31:55.821456
2187	3	3	1877	59	2	2026-06-03 12:31:55.823583
2188	3	3	1878	59	88	2026-06-03 12:31:55.825761
2189	3	3	1879	59	1148	2026-06-03 12:31:55.828423
2190	3	3	1880	59	27	2026-06-03 12:31:55.830592
2191	3	3	1881	59	86	2026-06-03 12:31:55.832622
2192	3	3	1882	59	19	2026-06-03 12:31:55.834549
2193	3	3	1883	59	75	2026-06-03 12:31:55.836502
2194	3	3	1884	59	43	2026-06-03 12:31:55.838505
2195	3	3	1885	59	105	2026-06-03 12:31:55.840636
2196	3	3	1886	59	63	2026-06-03 12:31:55.842981
2197	3	3	1887	59	35	2026-06-03 12:31:55.845582
2198	3	3	1888	59	124	2026-06-03 12:31:55.847728
2199	3	3	1889	59	50	2026-06-03 12:31:55.849751
2200	3	3	1890	59	121	2026-06-03 12:31:55.851775
2201	3	3	1891	59	62	2026-06-03 12:31:55.853778
2202	3	3	1892	59	113	2026-06-03 12:31:55.855843
2203	3	3	1893	59	11	2026-06-03 12:31:55.857971
2204	3	3	1894	59	43	2026-06-03 12:31:55.860394
2205	3	3	1895	59	54	2026-06-03 12:31:55.862798
2206	3	3	1896	59	51	2026-06-03 12:31:55.864898
2207	3	3	1897	59	532	2026-06-03 12:31:55.866941
2208	3	3	1898	59	25	2026-06-03 12:31:55.868939
2209	3	3	1899	59	40	2026-06-03 12:31:55.870937
2210	3	3	1900	59	12	2026-06-03 12:31:55.873074
2211	3	3	1901	59	28	2026-06-03 12:31:55.875129
2212	3	3	1902	59	3	2026-06-03 12:31:55.877617
2213	3	3	1903	59	22	2026-06-03 12:31:55.8799
2214	3	3	1904	59	16	2026-06-03 12:31:55.881982
2215	3	3	1905	59	38	2026-06-03 12:31:55.883977
2216	3	3	1906	59	398	2026-06-03 12:31:55.885963
2217	3	3	1907	59	80	2026-06-03 12:31:55.887949
2218	3	3	1908	59	18	2026-06-03 12:31:55.89016
2219	3	3	1909	59	54	2026-06-03 12:31:55.892314
2220	3	3	1910	59	35	2026-06-03 12:31:55.895008
2221	3	3	1911	59	39	2026-06-03 12:31:55.897257
2222	3	3	1912	59	52	2026-06-03 12:31:55.899274
2223	3	3	1913	59	37	2026-06-03 12:31:55.901259
2224	3	3	1914	59	60	2026-06-03 12:31:55.903271
2225	3	3	1915	59	36	2026-06-03 12:31:55.90526
2226	3	3	1916	59	464	2026-06-03 12:31:55.907478
2227	3	3	1917	59	50	2026-06-03 12:31:55.90973
2228	3	3	1918	59	31	2026-06-03 12:31:55.925796
2229	3	3	1919	59	79	2026-06-03 12:31:55.928799
2230	3	3	1920	59	25	2026-06-03 12:31:55.931524
2231	3	3	1921	59	78	2026-06-03 12:31:55.934084
2232	3	3	1922	59	1	2026-06-03 12:31:55.936591
2233	3	3	1923	59	42	2026-06-03 12:31:55.939168
2234	3	3	1924	59	129	2026-06-03 12:31:55.941903
2235	3	3	1925	59	90	2026-06-03 12:31:55.945042
2236	3	3	1926	59	19	2026-06-03 12:31:55.947841
2237	3	3	1927	59	50	2026-06-03 12:31:55.950426
2238	3	3	1928	59	32	2026-06-03 12:31:55.953016
2239	3	3	1929	59	495	2026-06-03 12:31:55.955549
2240	3	3	1930	59	64	2026-06-03 12:31:55.95828
2241	3	3	1931	59	913	2026-06-03 12:31:55.961226
2242	3	3	1932	59	25	2026-06-03 12:31:55.96415
2243	3	3	1933	59	58	2026-06-03 12:31:55.966801
2244	3	3	1934	59	42	2026-06-03 12:31:55.969335
2245	3	3	1935	59	36	2026-06-03 12:31:55.972057
2246	3	3	1936	59	76	2026-06-03 12:31:55.974821
2247	3	3	1937	59	84	2026-06-03 12:31:55.977784
2248	3	3	1938	59	70	2026-06-03 12:31:55.980663
2249	3	3	1939	59	107	2026-06-03 12:31:55.983262
2250	3	3	1940	59	25	2026-06-03 12:31:55.985812
2251	3	3	1941	59	15	2026-06-03 12:31:55.988327
2252	3	3	1942	59	93	2026-06-03 12:31:55.990996
2253	3	3	1943	59	59	2026-06-03 12:31:55.993939
2254	3	3	1944	59	58	2026-06-03 12:31:55.996998
2255	3	3	1945	59	16	2026-06-03 12:31:55.999576
2256	3	3	1946	59	70	2026-06-03 12:31:56.002176
2257	3	3	1947	59	55	2026-06-03 12:31:56.004699
2258	3	3	1948	59	86	2026-06-03 12:31:56.007374
2259	3	3	1949	59	39	2026-06-03 12:31:56.010231
2260	3	3	1950	59	35	2026-06-03 12:31:56.013431
2261	3	3	1951	59	41	2026-06-03 12:31:56.016065
2262	3	3	1952	59	133	2026-06-03 12:31:56.018649
2263	3	3	1953	59	89	2026-06-03 12:31:56.021235
2264	3	3	1954	59	21	2026-06-03 12:31:56.024045
2265	3	3	1955	59	144	2026-06-03 12:31:56.026906
2266	3	3	1956	59	53	2026-06-03 12:31:56.030047
2267	3	3	1957	59	17	2026-06-03 12:31:56.032681
2268	3	3	1958	59	84	2026-06-03 12:31:56.035247
2269	3	3	1959	59	99	2026-06-03 12:31:56.03791
2270	3	3	1960	59	76	2026-06-03 12:31:56.040667
2271	3	3	1961	59	25	2026-06-03 12:31:56.043518
2272	3	3	1962	59	2	2026-06-03 12:31:56.046737
2273	3	3	1963	59	43	2026-06-03 12:31:56.049437
2274	3	3	1964	59	25	2026-06-03 12:31:56.052047
2275	3	3	1965	59	12	2026-06-03 12:31:56.054598
2276	3	3	1966	59	8	2026-06-03 12:31:56.057251
2277	3	3	1967	59	41	2026-06-03 12:31:56.06006
2278	3	3	1968	59	64	2026-06-03 12:31:56.063306
2279	3	3	1969	59	76	2026-06-03 12:31:56.065978
2280	3	3	1970	59	104	2026-06-03 12:31:56.068635
2281	3	3	1971	59	90	2026-06-03 12:31:56.071209
2282	3	3	1972	59	3	2026-06-03 12:31:56.073899
2283	3	3	1973	59	286	2026-06-03 12:31:56.076743
2284	3	3	1974	59	45	2026-06-03 12:31:56.079958
2285	3	3	1975	59	159	2026-06-03 12:31:56.082693
2286	3	3	1976	59	10	2026-06-03 12:31:56.085283
2287	3	3	1977	59	127	2026-06-03 12:31:56.087965
2288	3	3	1978	59	335	2026-06-03 12:31:56.090778
2289	3	3	1979	59	131	2026-06-03 12:31:56.093623
2290	3	3	1980	59	938	2026-06-03 12:31:56.096752
2291	3	3	1981	59	609	2026-06-03 12:31:56.099495
2292	3	3	1982	59	87	2026-06-03 12:31:56.102128
2293	3	3	1983	59	9	2026-06-03 12:31:56.104708
2294	3	3	1984	59	58	2026-06-03 12:31:56.107504
2295	3	3	1985	59	720	2026-06-03 12:31:56.110341
2296	3	3	1986	59	160	2026-06-03 12:31:56.113504
2297	3	3	1987	59	22	2026-06-03 12:31:56.116224
2298	3	3	1988	59	36	2026-06-03 12:31:56.118814
2299	3	3	1989	59	93	2026-06-03 12:31:56.121409
2300	3	3	1990	59	66	2026-06-03 12:31:56.124214
2301	3	3	1991	59	30	2026-06-03 12:31:56.127161
2302	3	3	1992	59	69	2026-06-03 12:31:56.130323
2303	3	3	1993	59	27	2026-06-03 12:31:56.132993
2304	3	3	1994	59	10	2026-06-03 12:31:56.135574
2305	3	3	1995	59	46	2026-06-03 12:31:56.138134
2306	3	3	1996	59	41	2026-06-03 12:31:56.14081
2307	3	3	1997	59	2	2026-06-03 12:31:56.143591
2308	3	3	1998	59	13	2026-06-03 12:31:56.146728
2309	3	3	1999	59	27	2026-06-03 12:31:56.149564
2310	3	3	2000	53	775	2026-06-03 12:31:56.152419
2311	3	3	2001	53	275	2026-06-03 12:31:56.155455
2312	3	3	2002	53	63	2026-06-03 12:31:56.158715
2313	3	3	2003	53	45	2026-06-03 12:31:56.162051
2314	3	3	2004	53	196	2026-06-03 12:31:56.165056
2315	3	3	2005	53	322	2026-06-03 12:31:56.167696
2316	3	3	2006	53	18	2026-06-03 12:31:56.170284
2317	3	3	2007	53	165	2026-06-03 12:31:56.172765
2318	3	3	2008	53	506	2026-06-03 12:31:56.175625
2319	3	3	2009	53	482	2026-06-03 12:31:56.178741
2320	3	3	2010	53	305	2026-06-03 12:31:56.181686
2321	3	3	2011	53	15	2026-06-03 12:31:56.184303
2322	3	3	2012	53	25	2026-06-03 12:31:56.186879
2323	3	3	2013	53	35	2026-06-03 12:31:56.189413
2324	3	3	2014	53	48	2026-06-03 12:31:56.192325
2325	3	3	2015	53	37	2026-06-03 12:31:56.195482
2326	3	3	2016	53	117	2026-06-03 12:31:56.198336
2327	3	3	2017	53	498	2026-06-03 12:31:56.20093
2328	3	3	2018	53	55	2026-06-03 12:31:56.203531
2329	3	3	2019	53	542	2026-06-03 12:31:56.206217
2330	3	3	2020	53	125	2026-06-03 12:31:56.209021
2331	3	3	2021	53	119	2026-06-03 12:31:56.212148
2332	3	3	2022	53	1	2026-06-03 12:31:56.215037
2333	3	3	2023	53	32	2026-06-03 12:31:56.217689
2334	3	3	2024	53	224	2026-06-03 12:31:56.220265
2335	3	3	2025	53	84	2026-06-03 12:31:56.222852
2336	3	3	2026	53	151	2026-06-03 12:31:56.226024
2337	3	3	2027	53	36	2026-06-03 12:31:56.229472
2338	3	3	2028	53	123	2026-06-03 12:31:56.232763
2339	3	3	2029	53	947	2026-06-03 12:31:56.23564
2340	3	3	2030	53	119	2026-06-03 12:31:56.238403
2341	3	3	2031	53	709	2026-06-03 12:31:56.241448
2342	3	3	2032	53	11	2026-06-03 12:31:56.244574
2343	3	3	2033	53	382	2026-06-03 12:31:56.247812
2344	3	3	2034	53	67	2026-06-03 12:31:56.250553
2345	3	3	2035	53	598	2026-06-03 12:31:56.252957
2346	3	3	2036	59	24	2026-06-03 12:31:56.255275
2347	3	3	2037	59	86	2026-06-03 12:31:56.257824
2348	3	3	2038	59	179	2026-06-03 12:31:56.260357
2349	3	3	2039	59	53	2026-06-03 12:31:56.263299
2350	3	3	2040	59	34	2026-06-03 12:31:56.265752
2351	3	3	2041	59	765	2026-06-03 12:31:56.268385
2352	3	3	2042	59	19	2026-06-03 12:31:56.270958
2353	3	3	2043	59	36	2026-06-03 12:31:56.273359
2354	3	3	2044	59	35	2026-06-03 12:31:56.275852
2355	3	3	2045	59	18	2026-06-03 12:31:56.278708
2356	3	3	2046	59	42	2026-06-03 12:31:56.281368
2357	3	3	2047	59	54	2026-06-03 12:31:56.283708
2358	3	3	2048	59	40	2026-06-03 12:31:56.286005
2359	3	3	2049	59	29	2026-06-03 12:31:56.288278
2360	3	3	2050	59	33	2026-06-03 12:31:56.290698
2361	3	3	2051	59	31	2026-06-03 12:31:56.29315
2362	3	3	2052	59	59	2026-06-03 12:31:56.296033
2363	3	3	2053	59	8	2026-06-03 12:31:56.298506
2364	3	3	2054	59	65	2026-06-03 12:31:56.301025
2365	3	3	2055	59	71	2026-06-03 12:31:56.303304
2366	3	3	2056	59	736	2026-06-03 12:31:56.305578
2367	3	3	2057	59	8	2026-06-03 12:31:56.307947
2368	3	3	2058	59	67	2026-06-03 12:31:56.310376
2369	3	3	2059	59	242	2026-06-03 12:31:56.313285
2370	3	3	2060	59	75	2026-06-03 12:31:56.315772
2371	3	3	2061	59	151	2026-06-03 12:31:56.31879
2372	3	3	2062	59	476	2026-06-03 12:31:56.321139
2373	3	3	2063	59	277	2026-06-03 12:31:56.32348
2374	3	3	2064	59	47	2026-06-03 12:31:56.325925
2375	3	3	2065	59	29	2026-06-03 12:31:56.328651
2376	3	3	2066	59	44	2026-06-03 12:31:56.331411
2377	3	3	2067	59	159	2026-06-03 12:31:56.333743
2378	3	3	2068	59	188	2026-06-03 12:31:56.336041
2379	3	3	2069	59	210	2026-06-03 12:31:56.338284
2380	3	3	2070	59	22	2026-06-03 12:31:56.34051
2381	3	3	2071	59	351	2026-06-03 12:31:56.343008
2382	3	3	2072	59	28	2026-06-03 12:31:56.345962
2383	3	3	2073	59	42	2026-06-03 12:31:56.348624
2384	3	3	2074	59	221	2026-06-03 12:31:56.351067
2385	3	3	2075	59	25	2026-06-03 12:31:56.353411
2386	3	3	2076	59	14	2026-06-03 12:31:56.355712
2387	3	3	2077	59	102	2026-06-03 12:31:56.358116
2388	3	3	2078	59	246	2026-06-03 12:31:56.360585
2389	3	3	2079	59	138	2026-06-03 12:31:56.363521
2390	3	3	2080	59	1093	2026-06-03 12:31:56.366039
2391	3	3	2081	59	413	2026-06-03 12:31:56.36837
2392	3	3	2082	59	106	2026-06-03 12:31:56.370684
2393	3	3	2083	59	69	2026-06-03 12:31:56.372977
2394	3	3	2084	59	82	2026-06-03 12:31:56.375506
2395	3	3	2085	59	132	2026-06-03 12:31:56.378047
2396	3	3	2086	59	54	2026-06-03 12:31:56.380923
2397	3	3	2087	59	25	2026-06-03 12:31:56.383353
2398	3	3	2088	59	840	2026-06-03 12:31:56.385671
2399	3	3	2089	59	65	2026-06-03 12:31:56.387982
2400	3	3	2090	59	62	2026-06-03 12:31:56.390293
2401	3	3	2091	59	38	2026-06-03 12:31:56.392771
2402	3	3	2092	59	105	2026-06-03 12:31:56.395526
2403	3	3	2093	59	42	2026-06-03 12:31:56.398307
2404	3	3	2094	59	100	2026-06-03 12:31:56.400695
2405	3	3	2095	59	294	2026-06-03 12:31:56.403063
2406	3	3	2096	59	7	2026-06-03 12:31:56.405349
2407	3	3	2097	59	124	2026-06-03 12:31:56.407713
2408	3	3	2098	59	81	2026-06-03 12:31:56.410199
2409	3	3	2099	59	140	2026-06-03 12:31:56.413162
2410	3	3	2100	59	81	2026-06-03 12:31:56.415697
2411	3	3	2101	59	30	2026-06-03 12:31:56.418038
2412	3	3	2102	59	33	2026-06-03 12:31:56.420308
2413	3	3	2103	59	47	2026-06-03 12:31:56.422866
2414	3	3	2104	59	114	2026-06-03 12:31:56.425332
2415	3	3	2105	59	9	2026-06-03 12:31:56.42829
2416	3	3	2106	59	43	2026-06-03 12:31:56.431278
2417	3	3	2107	59	7	2026-06-03 12:31:56.433662
2418	3	3	2108	59	29	2026-06-03 12:31:56.435971
2419	3	3	2109	59	84	2026-06-03 12:31:56.438257
2420	3	3	2110	59	51	2026-06-03 12:31:56.440524
2421	3	3	2111	59	68	2026-06-03 12:31:56.44299
2422	3	3	2112	59	37	2026-06-03 12:31:56.445725
2423	3	3	2113	59	26	2026-06-03 12:31:56.448499
2424	3	3	2114	59	27	2026-06-03 12:31:56.450862
2425	3	3	2115	59	67	2026-06-03 12:31:56.453236
2426	3	3	2116	59	50	2026-06-03 12:31:56.455554
2427	3	3	2117	59	1298	2026-06-03 12:31:56.457927
2428	3	3	2118	59	37	2026-06-03 12:31:56.460397
2429	3	3	2119	59	774	2026-06-03 12:31:56.463329
2430	3	3	2120	59	112	2026-06-03 12:31:56.46592
2431	3	3	2121	59	22	2026-06-03 12:31:56.468266
2432	3	3	2122	59	29	2026-06-03 12:31:56.470552
2433	3	3	2123	59	28	2026-06-03 12:31:56.472853
2434	3	3	2124	59	41	2026-06-03 12:31:56.475285
2435	3	3	2125	59	149	2026-06-03 12:31:56.477824
2436	3	3	2126	59	163	2026-06-03 12:31:56.480918
2437	3	3	2127	59	36	2026-06-03 12:31:56.483361
2438	3	3	2128	59	44	2026-06-03 12:31:56.485678
2439	3	3	2129	59	36	2026-06-03 12:31:56.487981
2440	3	3	2130	59	66	2026-06-03 12:31:56.490301
2441	3	3	2131	59	68	2026-06-03 12:31:56.492841
2442	3	3	2132	59	29	2026-06-03 12:31:56.495511
2443	3	3	2133	59	1387	2026-06-03 12:31:56.498516
2444	3	3	2134	59	138	2026-06-03 12:31:56.50093
2445	3	3	2135	59	108	2026-06-03 12:31:56.503288
2446	3	3	2136	59	21	2026-06-03 12:31:56.505549
2447	3	3	2137	59	1139	2026-06-03 12:31:56.50789
2448	3	3	2138	59	32	2026-06-03 12:31:56.510402
2449	3	3	2139	59	41	2026-06-03 12:31:56.513271
2450	3	3	2140	51	756	2026-06-03 12:31:56.515941
2451	3	3	2141	51	48	2026-06-03 12:31:56.518278
2452	3	3	2142	51	630	2026-06-03 12:31:56.520586
2453	3	3	2143	51	521	2026-06-03 12:31:56.522905
2454	3	3	2144	51	110	2026-06-03 12:31:56.525353
2455	3	3	2145	51	23	2026-06-03 12:31:56.527944
2456	3	3	2146	51	645	2026-06-03 12:31:56.530918
2457	3	3	2147	51	923	2026-06-03 12:31:56.533422
2458	3	3	2148	51	906	2026-06-03 12:31:56.535798
2459	3	3	2149	51	113	2026-06-03 12:31:56.538063
2460	3	3	2150	51	651	2026-06-03 12:31:56.540319
2461	3	3	2151	51	750	2026-06-03 12:31:56.542756
2462	3	3	2152	51	129	2026-06-03 12:31:56.545442
2463	3	3	2153	51	253	2026-06-03 12:31:56.548327
2464	3	3	2154	51	1075	2026-06-03 12:31:56.550795
2465	3	3	2155	51	263	2026-06-03 12:31:56.553204
2466	3	3	2156	51	336	2026-06-03 12:31:56.555545
2467	3	3	2157	51	1065	2026-06-03 12:31:56.558008
2468	3	3	2158	51	458	2026-06-03 12:31:56.560509
2469	3	3	2159	51	387	2026-06-03 12:31:56.563357
2470	3	3	2160	51	539	2026-06-03 12:31:56.565988
2471	3	3	2161	51	332	2026-06-03 12:31:56.568396
2472	3	3	2162	51	569	2026-06-03 12:31:56.570728
2473	3	3	2163	51	932	2026-06-03 12:31:56.573051
2474	3	3	2164	51	495	2026-06-03 12:31:56.575669
2475	3	3	2165	51	674	2026-06-03 12:31:56.578206
2476	3	3	2166	51	1346	2026-06-03 12:31:56.581035
2477	3	3	2167	51	128	2026-06-03 12:31:56.583673
2478	3	3	2168	51	427	2026-06-03 12:31:56.585997
2479	3	3	2169	51	419	2026-06-03 12:31:56.588293
2480	3	3	2170	51	196	2026-06-03 12:31:56.590602
2481	3	3	2171	51	1349	2026-06-03 12:31:56.592985
2482	3	3	2172	51	42	2026-06-03 12:31:56.595498
2483	3	3	2173	51	80	2026-06-03 12:31:56.598407
2484	3	3	2174	51	689	2026-06-03 12:31:56.600828
2485	3	3	2175	51	785	2026-06-03 12:31:56.603178
2486	3	3	2176	51	720	2026-06-03 12:31:56.60548
2487	3	3	2177	51	643	2026-06-03 12:31:56.607777
2488	3	3	2178	51	110	2026-06-03 12:31:56.610357
2489	3	3	2179	51	322	2026-06-03 12:31:56.61312
2490	3	3	2180	51	551	2026-06-03 12:31:56.61585
2491	3	3	2181	51	928	2026-06-03 12:31:56.618253
2492	3	3	2182	51	377	2026-06-03 12:31:56.620558
2493	3	3	2183	51	781	2026-06-03 12:31:56.622904
2494	3	3	2184	51	345	2026-06-03 12:31:56.625438
2495	3	3	2185	51	113	2026-06-03 12:31:56.627891
2496	3	3	2186	51	673	2026-06-03 12:31:56.630867
2497	3	3	2187	51	385	2026-06-03 12:31:56.633535
2498	3	3	2188	51	482	2026-06-03 12:31:56.635938
2499	3	3	2189	51	411	2026-06-03 12:31:56.638254
2500	3	3	2190	51	573	2026-06-03 12:31:56.640709
2501	3	3	2191	51	364	2026-06-03 12:31:56.643213
2502	3	3	2192	51	1192	2026-06-03 12:31:56.645873
2503	3	3	2193	51	771	2026-06-03 12:31:56.648757
2504	3	3	2194	51	1114	2026-06-03 12:31:56.651326
2505	3	3	2195	51	208	2026-06-03 12:31:56.653983
2506	3	3	2196	51	581	2026-06-03 12:31:56.656548
2507	3	3	2197	51	227	2026-06-03 12:31:56.659469
2508	3	3	2198	51	683	2026-06-03 12:31:56.662121
2509	3	3	2199	51	589	2026-06-03 12:31:56.66513
2510	3	3	2200	51	283	2026-06-03 12:31:56.667611
2511	3	3	2201	51	323	2026-06-03 12:31:56.669942
2512	3	3	2202	51	707	2026-06-03 12:31:56.672235
2513	3	3	2203	51	623	2026-06-03 12:31:56.674596
2514	3	3	2204	51	569	2026-06-03 12:31:56.677119
2515	3	3	2205	51	399	2026-06-03 12:31:56.67972
2516	3	3	2206	51	68	2026-06-03 12:31:56.68261
2517	3	3	2207	51	945	2026-06-03 12:31:56.685004
2518	3	3	2208	51	578	2026-06-03 12:31:56.687287
2519	3	3	2209	51	1036	2026-06-03 12:31:56.689551
2520	3	3	2210	51	50	2026-06-03 12:31:56.691896
2521	3	3	2211	51	1123	2026-06-03 12:31:56.694405
2522	3	3	2212	51	493	2026-06-03 12:31:56.697292
2523	3	3	2213	51	64	2026-06-03 12:31:56.699935
2524	3	3	2214	51	1212	2026-06-03 12:31:56.7023
2525	3	3	2215	51	523	2026-06-03 12:31:56.704615
2526	3	3	2216	51	1246	2026-06-03 12:31:56.706923
2527	3	3	2217	51	526	2026-06-03 12:31:56.709392
2528	3	3	2218	51	908	2026-06-03 12:31:56.711876
2529	3	3	2219	51	1334	2026-06-03 12:31:56.714785
2530	3	3	2220	51	797	2026-06-03 12:31:56.71728
2531	3	3	2221	51	36	2026-06-03 12:31:56.719622
2532	3	3	2222	51	260	2026-06-03 12:31:56.721949
2533	3	3	2223	51	139	2026-06-03 12:31:56.72431
2534	3	3	2224	51	186	2026-06-03 12:31:56.726832
2535	3	3	2225	51	382	2026-06-03 12:31:56.729461
2536	3	3	2226	51	172	2026-06-03 12:31:56.732321
2537	3	3	2227	51	276	2026-06-03 12:31:56.734736
2538	3	3	2228	51	242	2026-06-03 12:31:56.737074
2539	3	3	2229	51	474	2026-06-03 12:31:56.73953
2540	3	3	2230	51	162	2026-06-03 12:31:56.742086
2541	3	3	2231	51	562	2026-06-03 12:31:56.744627
2542	3	3	2232	51	310	2026-06-03 12:31:56.747516
2543	3	3	2233	51	716	2026-06-03 12:31:56.750148
2544	3	3	2234	51	1086	2026-06-03 12:31:56.752568
2545	3	3	2235	51	572	2026-06-03 12:31:56.75493
2546	3	3	2236	51	352	2026-06-03 12:31:56.757245
2547	3	3	2237	51	311	2026-06-03 12:31:56.759701
2548	3	3	2238	51	690	2026-06-03 12:31:56.762174
2549	3	3	2239	51	96	2026-06-03 12:31:56.76512
2550	3	3	2240	51	229	2026-06-03 12:31:56.767627
2551	3	3	2241	51	610	2026-06-03 12:31:56.769974
2552	3	3	2242	51	287	2026-06-03 12:31:56.772356
2553	3	3	2243	51	414	2026-06-03 12:31:56.7747
2554	3	3	2244	51	946	2026-06-03 12:31:56.777208
2555	3	3	2245	51	1399	2026-06-03 12:31:56.77996
2556	3	3	2246	51	18	2026-06-03 12:31:56.782745
2557	3	3	2247	51	485	2026-06-03 12:31:56.785151
2558	3	3	2248	51	143	2026-06-03 12:31:56.787476
2559	3	3	2249	51	110	2026-06-03 12:31:56.789814
2560	3	3	2250	51	1102	2026-06-03 12:31:56.792263
2561	3	3	2251	51	1112	2026-06-03 12:31:56.794738
2562	3	3	2252	51	411	2026-06-03 12:31:56.797647
2563	3	3	2253	51	892	2026-06-03 12:31:56.800312
2564	3	3	2254	51	571	2026-06-03 12:31:56.802698
2565	3	3	2255	51	686	2026-06-03 12:31:56.805017
2566	3	3	2256	51	1058	2026-06-03 12:31:56.807371
2567	3	3	2257	51	763	2026-06-03 12:31:56.809957
2568	3	3	2258	51	176	2026-06-03 12:31:56.812516
2569	3	3	2259	51	385	2026-06-03 12:31:56.815473
2570	3	3	2260	51	232	2026-06-03 12:31:56.817938
2571	3	3	2261	51	725	2026-06-03 12:31:56.820311
2572	3	3	2262	51	447	2026-06-03 12:31:56.822784
2573	3	3	2263	51	745	2026-06-03 12:31:56.825131
2574	3	3	2264	51	484	2026-06-03 12:31:56.82758
2575	3	3	2265	51	126	2026-06-03 12:31:56.830291
2576	3	3	2266	51	228	2026-06-03 12:31:56.833077
2577	3	3	2267	51	688	2026-06-03 12:31:56.835476
2578	3	3	2268	51	360	2026-06-03 12:31:56.837878
2579	3	3	2269	51	320	2026-06-03 12:31:56.840215
2580	3	3	2270	51	487	2026-06-03 12:31:56.842549
2581	3	3	2271	51	165	2026-06-03 12:31:56.845127
2582	3	3	2272	51	109	2026-06-03 12:31:56.848073
2583	3	3	2273	51	644	2026-06-03 12:31:56.850611
2584	3	3	2274	51	441	2026-06-03 12:31:56.853037
2585	3	3	2275	51	678	2026-06-03 12:31:56.855371
2586	3	3	2276	51	95	2026-06-03 12:31:56.857692
2587	3	3	2277	51	1049	2026-06-03 12:31:56.860162
2588	3	3	2278	51	411	2026-06-03 12:31:56.862691
2589	3	3	2279	51	175	2026-06-03 12:31:56.865644
2590	3	3	2280	51	477	2026-06-03 12:31:56.868111
2591	3	3	2281	51	707	2026-06-03 12:31:56.870477
2592	3	3	2282	51	892	2026-06-03 12:31:56.872883
2593	3	3	2283	51	663	2026-06-03 12:31:56.875231
2594	3	3	2284	51	193	2026-06-03 12:31:56.877758
2595	3	3	2285	51	509	2026-06-03 12:31:56.880582
2596	3	3	2286	51	161	2026-06-03 12:31:56.883374
2597	3	3	2287	51	26	2026-06-03 12:31:56.885777
2598	3	3	2288	51	360	2026-06-03 12:31:56.888135
2599	3	3	2289	51	425	2026-06-03 12:31:56.890474
2600	3	3	2290	51	25	2026-06-03 12:31:56.892847
2601	3	3	2291	51	681	2026-06-03 12:31:56.89535
2602	3	3	2292	51	457	2026-06-03 12:31:56.898308
2603	3	3	2293	51	556	2026-06-03 12:31:56.900926
2604	3	3	2294	51	158	2026-06-03 12:31:56.903348
2605	3	3	2295	51	347	2026-06-03 12:31:56.905689
2606	3	3	2296	51	779	2026-06-03 12:31:56.908041
2607	3	3	2297	51	363	2026-06-03 12:31:56.910662
2608	3	3	2298	51	428	2026-06-03 12:31:56.913352
2609	3	3	2299	51	496	2026-06-03 12:31:56.916281
2610	3	3	2300	51	42	2026-06-03 12:31:56.91872
2611	3	3	2301	51	315	2026-06-03 12:31:56.921035
2612	3	3	2302	51	208	2026-06-03 12:31:56.923368
2613	3	3	2303	51	1196	2026-06-03 12:31:56.925682
2614	3	3	2304	51	472	2026-06-03 12:31:56.928155
2615	3	3	2305	51	949	2026-06-03 12:31:56.930946
2616	3	3	2306	51	645	2026-06-03 12:31:56.933668
2617	3	3	2307	51	771	2026-06-03 12:31:56.936061
2618	3	3	2308	51	430	2026-06-03 12:31:56.93837
2619	3	3	2309	51	135	2026-06-03 12:31:56.940694
2620	3	3	2310	51	51	2026-06-03 12:31:56.943111
2621	3	3	2311	51	157	2026-06-03 12:31:56.945572
2622	3	3	2312	51	174	2026-06-03 12:31:56.948544
2623	3	3	2313	51	142	2026-06-03 12:31:56.951241
2624	3	3	2314	51	69	2026-06-03 12:31:56.953626
2625	3	3	2315	51	193	2026-06-03 12:31:56.955972
2626	3	3	2316	51	600	2026-06-03 12:31:56.958295
2627	3	3	2317	51	487	2026-06-03 12:31:56.960704
2628	3	3	2318	51	19	2026-06-03 12:31:56.963272
2629	3	3	2319	51	778	2026-06-03 12:31:56.966221
2630	3	3	2320	51	75	2026-06-03 12:31:56.968688
2631	3	3	2321	51	943	2026-06-03 12:31:56.970991
2632	3	3	2322	51	826	2026-06-03 12:31:56.973325
2633	3	3	2323	51	355	2026-06-03 12:31:56.975669
2634	3	3	2324	51	290	2026-06-03 12:31:56.97819
2635	3	3	2325	51	217	2026-06-03 12:31:56.980898
2636	3	3	2326	51	556	2026-06-03 12:31:56.9837
2637	3	3	2327	51	2	2026-06-03 12:31:56.986206
2638	3	3	2328	51	545	2026-06-03 12:31:56.988495
2639	3	3	2329	51	104	2026-06-03 12:31:56.990796
2640	3	3	2330	51	558	2026-06-03 12:31:56.993188
2641	3	3	2331	51	114	2026-06-03 12:31:56.995686
2642	3	3	2332	51	146	2026-06-03 12:31:56.998613
2643	3	3	2333	51	230	2026-06-03 12:31:57.001219
2644	3	3	2334	51	486	2026-06-03 12:31:57.002798
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, tenant_id, site_id, name, code, accounting_code, building_id, is_active, is_deleted, created_at) FROM stdin;
1	3	3	CIVIL	DEPT-00001	\N	1	t	f	2026-05-15 13:15:35.449236
2	3	3	ADMIN	DEPT-00002	\N	1	t	f	2026-05-15 13:19:20.067632
3	2	2	Physiotherapy Dept	DEPT-00001	\N	4	t	f	2026-05-21 16:31:55.999016
5	3	3	CAMP WARD 2 ND FLOOR	DEPT-00004	\N	1	t	f	2026-06-03 11:00:15.062725
6	3	3	CLINICAL DEPARTMENT	DEPT-00005	\N	1	t	f	2026-06-03 11:00:15.107155
7	3	3	COMM- CENTRE BELUVAl	DEPT-00006	\N	1	t	f	2026-06-03 11:00:15.127705
8	3	3	COMMUNITY CENTRE - SHAKTHI	DEPT-00007	\N	1	t	f	2026-06-03 11:00:15.143898
9	3	3	GAS MANIFOLD	DEPT-00008	\N	1	t	f	2026-06-03 11:00:15.157028
10	3	3	GENERIC PHARMACY	DEPT-00009	\N	1	t	f	2026-06-03 11:00:15.172452
11	3	3	2DECHO AND TMT ROOM	DEPT-00010	\N	1	t	f	2026-06-03 11:00:15.189215
12	3	3	ACCOUNTS DEPT	DEPT-00011	\N	1	t	f	2026-06-03 11:00:15.205808
13	3	3	ADMIN BLOCK	DEPT-00012	\N	1	t	f	2026-06-03 11:00:15.222158
14	3	3	AIR-CONDITIONING -MAINTENANCE	DEPT-00013	\N	1	t	f	2026-06-03 11:00:15.260498
15	3	3	ALLIED HEALTH SCIENCE	DEPT-00014	\N	1	t	f	2026-06-03 11:00:15.285483
16	3	3	ANATOMY	DEPT-00015	\N	1	t	f	2026-06-03 11:00:15.301317
17	3	3	ART CENTRE	DEPT-00016	\N	1	t	f	2026-06-03 11:00:15.313807
18	3	3	BILLING SECTION	DEPT-00017	\N	1	t	f	2026-06-03 11:00:15.330569
19	3	3	BIO CHEMISTRY	DEPT-00018	\N	1	t	f	2026-06-03 11:00:15.347301
20	3	3	BIOCHEMISTRY MEDICAL COLLEGE	DEPT-00019	\N	1	t	f	2026-06-03 11:00:15.363949
21	3	3	BIO-MEDICAL	DEPT-00020	\N	1	t	f	2026-06-03 11:00:15.381985
22	3	3	BLOOD BANK	DEPT-00021	\N	1	t	f	2026-06-03 11:00:15.3984
23	3	3	CAFETERIA	DEPT-00022	\N	1	t	f	2026-06-03 11:00:15.41507
24	3	3	CAMP,	DEPT-00023	\N	1	t	f	2026-06-03 11:00:15.431827
25	3	3	Camp-Inpatient	DEPT-00024	\N	1	t	f	2026-06-03 11:00:15.446594
26	3	3	CARDIO THORACIC 0.T	DEPT-00025	\N	1	t	f	2026-06-03 11:00:15.453746
27	3	3	CARDIO THORACIC UNIT	DEPT-00026	\N	1	t	f	2026-06-03 11:00:15.461088
28	3	3	CARPENTER DEPARTMENT	DEPT-00027	\N	1	t	f	2026-06-03 11:00:15.469223
29	3	3	CASUALTY	DEPT-00028	\N	1	t	f	2026-06-03 11:00:15.485772
30	3	3	CEO SIR CABIN	DEPT-00029	\N	1	t	f	2026-06-03 11:00:15.501756
31	3	3	CHINNAPPA CANTEEN	DEPT-00030	\N	1	t	f	2026-06-03 11:00:15.515912
32	3	3	CIVIL DEPARTMENT	DEPT-00031	\N	1	t	f	2026-06-03 11:00:15.53275
33	3	3	CLINICAL PHARMACOLOGY	DEPT-00032	\N	1	t	f	2026-06-03 11:00:15.549347
34	3	3	COLLEGE OF NURSING	DEPT-00033	\N	1	t	f	2026-06-03 11:00:15.565946
35	3	3	COMMUNITY CENTER PERAR	DEPT-00034	\N	1	t	f	2026-06-03 11:00:15.582602
36	3	3	Community Centre - Goodshedde	DEPT-00035	\N	1	t	f	2026-06-03 11:00:15.599383
37	3	3	COMMUNITY CENTRE - KAVOOR	DEPT-00036	\N	1	t	f	2026-06-03 11:00:15.615782
38	3	3	COMMUNITY CENTRE - PANE MANGAL	DEPT-00037	\N	1	t	f	2026-06-03 11:00:15.63266
39	3	3	COMMUNITY MEDICINE	DEPT-00038	\N	1	t	f	2026-06-03 11:00:15.64817
40	3	3	COMPUTER DEPARTMENT	DEPT-00039	\N	1	t	f	2026-06-03 11:00:15.66311
41	3	3	CORPORATE	DEPT-00040	\N	1	t	f	2026-06-03 11:00:15.670243
42	3	3	COU	DEPT-00041	\N	1	t	f	2026-06-03 11:00:15.677917
43	3	3	COUNCIL ROOM MEDICAL COLLEGE	DEPT-00042	\N	1	t	f	2026-06-03 11:00:15.685943
44	3	3	CVS	DEPT-00043	\N	1	t	f	2026-06-03 11:00:15.694155
45	3	3	CYTO PATHOLOGY	DEPT-00044	\N	1	t	f	2026-06-03 11:00:15.702243
46	3	3	DENTAL - ORTHODONTICS	DEPT-00045	\N	1	t	f	2026-06-03 11:00:15.710881
47	3	3	DENTAL DEPARTMENTS MATERIAL	DEPT-00046	\N	1	t	f	2026-06-03 11:00:15.718845
48	3	3	DENTAL LIBRARY	DEPT-00047	\N	1	t	f	2026-06-03 11:00:15.736009
49	3	3	Dental O.P.D Oral Surgery	DEPT-00048	\N	1	t	f	2026-06-03 11:00:15.752811
50	3	3	DENTAL ORAL MEDICINE & RADIOLOGY	DEPT-00049	\N	1	t	f	2026-06-03 11:00:15.768918
51	3	3	DENTAL PEDODONTICS	DEPT-00050	\N	1	t	f	2026-06-03 11:00:15.785619
52	3	3	DENTAL PROSTHODONTICS	DEPT-00051	\N	1	t	f	2026-06-03 11:00:15.80002
53	3	3	DENTAL-LIBRARY	DEPT-00052	\N	1	t	f	2026-06-03 11:00:15.812888
54	3	3	DENTAL-PERIODONTICS	DEPT-00053	\N	1	t	f	2026-06-03 11:00:15.820975
55	3	3	DEPARTMENT OF PHARMACY PRACTICE	DEPT-00054	\N	1	t	f	2026-06-03 11:00:15.829545
56	3	3	DEPT OF CSSD	DEPT-00055	\N	1	t	f	2026-06-03 11:00:15.83826
57	3	3	DEPT OF OPTHALMOLOGY	DEPT-00056	\N	1	t	f	2026-06-03 11:00:15.846134
58	3	3	DEPT OF ORTHOPAEDIC	DEPT-00057	\N	1	t	f	2026-06-03 11:00:15.854306
59	3	3	DIALYSIS	DEPT-00058	\N	1	t	f	2026-06-03 11:00:15.862714
60	3	3	DIETARY DEPARTMENT	DEPT-00059	\N	1	t	f	2026-06-03 11:00:15.870898
61	3	3	DRUG INFORMATION CENTRE	DEPT-00060	\N	1	t	f	2026-06-03 11:00:15.879604
62	3	3	EAST POINT COLLEGE OF ENGINEERING AND TECHNOLOGY	DEPT-00061	\N	1	t	f	2026-06-03 11:00:15.888281
63	3	3	EAST POINT COLLEGE OF HIGHER EDUCATION	DEPT-00062	\N	1	t	f	2026-06-03 11:00:15.896104
64	3	3	EAST POINT COLLEGE OF NURSING	DEPT-00063	\N	1	t	f	2026-06-03 11:00:15.904421
65	3	3	EAST POINT COLLEGE OF PHARMACY	DEPT-00064	\N	1	t	f	2026-06-03 11:00:15.912967
66	3	3	ELECTRICAL DG -MAINTENANCE	DEPT-00065	\N	1	t	f	2026-06-03 11:00:15.921136
67	3	3	EMERGENCY GREEN ZONE	DEPT-00066	\N	1	t	f	2026-06-03 11:00:15.929348
68	3	3	EMERGENCY ICU	DEPT-00067	\N	1	t	f	2026-06-03 11:00:15.938235
69	3	3	EMERGENCY YELLOW ZONE	DEPT-00068	\N	1	t	f	2026-06-03 11:00:15.945742
70	3	3	ENDOSCOPY	DEPT-00069	\N	1	t	f	2026-06-03 11:00:15.953069
71	3	3	ENGINEERING COLLEGE DEPARTMENT	DEPT-00070	\N	1	t	f	2026-06-03 11:00:15.961755
72	3	3	EQUIPMENT -DEPT	DEPT-00071	\N	1	t	f	2026-06-03 11:00:15.969626
73	3	3	EXAMINATION HALL,	DEPT-00072	\N	1	t	f	2026-06-03 11:00:15.986145
74	3	3	FACILITIES MANAGEMENT	DEPT-00073	\N	1	t	f	2026-06-03 11:00:15.99994
75	3	3	FACULTY SECTION MEDICAL COLLEGE	DEPT-00074	\N	1	t	f	2026-06-03 11:00:16.014275
76	3	3	FORENSIC MEDICINE	DEPT-00075	\N	1	t	f	2026-06-03 11:00:16.030933
77	3	3	GRAPHIC DESIGNING SECTION	DEPT-00076	\N	1	t	f	2026-06-03 11:00:16.047464
78	3	3	HELIOS CONSTRUCTION DEPARTMENT	DEPT-00077	\N	1	t	f	2026-06-03 11:00:16.064286
79	3	3	HELP	DEPT-00078	\N	1	t	f	2026-06-03 11:00:16.080882
80	3	3	HISTOPATHOLOGY	DEPT-00079	\N	1	t	f	2026-06-03 11:00:16.097657
81	3	3	HOSPITAL ADMINISTRATION	DEPT-00080	\N	1	t	f	2026-06-03 11:00:16.11911
82	3	3	HOSPITAL SUPERVISOR	DEPT-00081	\N	1	t	f	2026-06-03 11:00:16.135996
83	3	3	ICT	DEPT-00082	\N	1	t	f	2026-06-03 11:00:16.151539
84	3	3	INFECTION CONTROL DEPARTMENT	DEPT-00083	\N	1	t	f	2026-06-03 11:00:16.164103
85	3	3	INSTITUTIONAL ETHICS DEPARTMENT	DEPT-00084	\N	1	t	f	2026-06-03 11:00:16.180906
86	3	3	INSURANCE DEPARTMENT	DEPT-00085	\N	1	t	f	2026-06-03 11:00:16.197609
87	3	3	INTERNAL AUDIT DEPARTMENT	DEPT-00086	\N	1	t	f	2026-06-03 11:00:16.214201
88	3	3	IT DEPARTMENT	DEPT-00087	\N	1	t	f	2026-06-03 11:00:16.231018
89	3	3	ITU	DEPT-00088	\N	1	t	f	2026-06-03 11:00:16.247504
90	3	3	LAUNDRY	DEPT-00089	\N	1	t	f	2026-06-03 11:00:16.269351
91	3	3	M.G CHARITABLE TRUST	DEPT-00090	\N	1	t	f	2026-06-03 11:00:16.28624
92	3	3	MAINTENANCE	DEPT-00091	\N	1	t	f	2026-06-03 11:00:16.301892
93	3	3	MAINTENANCE MEDICAL OXYGEN	DEPT-00092	\N	1	t	f	2026-06-03 11:00:16.314325
94	3	3	MARKETING DEPARTMENT	DEPT-00093	\N	1	t	f	2026-06-03 11:00:16.331003
95	3	3	MECHANICAL MAINTENANCE	DEPT-00094	\N	1	t	f	2026-06-03 11:00:16.347596
96	3	3	MEDICAL COLLEGE	DEPT-00095	\N	1	t	f	2026-06-03 11:00:16.369334
97	3	3	MEDICAL COLLEGE HSK SUPERVISOR	DEPT-00096	\N	1	t	f	2026-06-03 11:00:16.38596
98	3	3	MEDICAL EDUCATION UNIT - AJIMS	DEPT-00097	\N	1	t	f	2026-06-03 11:00:16.402986
99	3	3	MEDICAL SOCIAL WORKER	DEPT-00098	\N	1	t	f	2026-06-03 11:00:16.417667
100	3	3	MEDICAL-LIBRARY	DEPT-00099	\N	1	t	f	2026-06-03 11:00:16.429741
101	3	3	MICU	DEPT-00100	\N	1	t	f	2026-06-03 11:00:16.43737
102	3	3	MORTUARY	DEPT-00101	\N	1	t	f	2026-06-03 11:00:16.44474
103	3	3	MRD	DEPT-00102	\N	1	t	f	2026-06-03 11:00:16.452391
104	3	3	NABH	DEPT-00103	\N	2	t	f	2026-06-03 11:00:16.469215
105	3	3	NESCAFE	DEPT-00104	\N	2	t	f	2026-06-03 11:00:16.4864
106	3	3	NEW ROYAL COLLEGE OF NURSING	DEPT-00105	\N	2	t	f	2026-06-03 11:00:16.499692
107	3	3	NICU	DEPT-00106	\N	2	t	f	2026-06-03 11:00:16.518976
108	3	3	NUCLEAR MEDICINE	DEPT-00107	\N	2	t	f	2026-06-03 11:00:16.535557
109	3	3	OBG ADMINISTRATION	DEPT-00108	\N	2	t	f	2026-06-03 11:00:16.549752
110	3	3	OBG MARKETING	DEPT-00109	\N	2	t	f	2026-06-03 11:00:16.564709
111	3	3	OBG-HDU	DEPT-00110	\N	2	t	f	2026-06-03 11:00:16.581313
112	3	3	OCCUPATIONAL THERAPY DEPARTMENT	DEPT-00111	\N	2	t	f	2026-06-03 11:00:16.597825
113	3	3	PACKAGE - ASD CLOSURE	DEPT-00112	\N	2	t	f	2026-06-03 11:00:16.61455
114	3	3	PAINTING DEPARTMENT	DEPT-00113	\N	2	t	f	2026-06-03 11:00:16.63144
115	3	3	PARAMEDICAL	DEPT-00114	\N	2	t	f	2026-06-03 11:00:16.647855
116	3	3	PATHOLOGY	DEPT-00115	\N	2	t	f	2026-06-03 11:00:16.66456
117	3	3	PATHOLOGY MEDICAL COLLEGE	DEPT-00116	\N	2	t	f	2026-06-03 11:00:16.682755
118	3	3	PHARMACOLOGY	DEPT-00117	\N	2	t	f	2026-06-03 11:00:16.699412
119	3	3	PHARMACOLOGY CLINICAL TRIAL UNIT	DEPT-00118	\N	2	t	f	2026-06-03 11:00:16.719047
120	3	3	PHARMACY COLLEGE	DEPT-00119	\N	2	t	f	2026-06-03 11:00:16.736553
121	3	3	PHYSIOLOGY	DEPT-00120	\N	2	t	f	2026-06-03 11:00:16.750434
122	3	3	PICU	DEPT-00121	\N	2	t	f	2026-06-03 11:00:16.766783
123	3	3	PLUMBING -MAINTENANCE	DEPT-00122	\N	2	t	f	2026-06-03 11:00:16.783486
124	3	3	POST OPERATIVE	DEPT-00123	\N	2	t	f	2026-06-03 11:00:16.798639
125	3	3	POW&SPW	DEPT-00124	\N	2	t	f	2026-06-03 11:00:16.819337
126	3	3	PRO MARKETING	DEPT-00125	\N	2	t	f	2026-06-03 11:00:16.835915
127	3	3	PROJECT MANAGER SECTION	DEPT-00126	\N	2	t	f	2026-06-03 11:00:16.848339
128	3	3	PUC DEPARTMENT	DEPT-00127	\N	2	t	f	2026-06-03 11:00:16.869212
129	3	3	PURCHASE DEPARTMENT	DEPT-00128	\N	2	t	f	2026-06-03 11:00:16.885744
130	3	3	RADIOLOGY	DEPT-00129	\N	2	t	f	2026-06-03 11:00:16.899773
131	3	3	REGISTRATION	DEPT-00130	\N	2	t	f	2026-06-03 11:00:16.914257
132	3	3	RHTC	DEPT-00131	\N	2	t	f	2026-06-03 11:00:16.9287
133	3	3	SAMPLE COLLECTION	DEPT-00132	\N	2	t	f	2026-06-03 11:00:16.93643
134	3	3	SECURITY	DEPT-00133	\N	2	t	f	2026-06-03 11:00:16.944687
135	3	3	SECURITY DEPT	DEPT-00134	\N	2	t	f	2026-06-03 11:00:16.952661
136	3	3	SEROLOGY	DEPT-00135	\N	2	t	f	2026-06-03 11:00:16.969264
137	3	3	SICU	DEPT-00136	\N	2	t	f	2026-06-03 11:00:16.986009
138	3	3	SOCIAL AND PREVENTIVE MEDICINE	DEPT-00137	\N	2	t	f	2026-06-03 11:00:17.002896
139	3	3	SPORTS DEPARTMENT	DEPT-00138	\N	2	t	f	2026-06-03 11:00:17.014576
140	3	3	STUDENT SECTION MEDICAL COLLEGE	DEPT-00139	\N	2	t	f	2026-06-03 11:00:17.031363
141	3	3	TAILORING DEPARTMENT	DEPT-00140	\N	2	t	f	2026-06-03 11:00:17.047742
142	3	3	TRANSPORT DEPARTMENT	DEPT-00141	\N	2	t	f	2026-06-03 11:00:17.064344
143	3	3	UHTC	DEPT-00142	\N	2	t	f	2026-06-03 11:00:17.081311
144	3	3	WELDING DEPARTMENT	DEPT-00143	\N	2	t	f	2026-06-03 11:00:17.098045
145	3	3	CATH LAB	DEPT-00144	\N	2	t	f	2026-06-03 11:00:17.115563
146	3	3	CATH LAB TECHNICIAN	DEPT-00145	\N	2	t	f	2026-06-03 11:00:17.136099
147	3	3	CATH LABORATORY	DEPT-00146	\N	2	t	f	2026-06-03 11:00:17.151689
148	3	3	LAB COMMUNITY CENTER - KAROOR	DEPT-00147	\N	2	t	f	2026-06-03 11:00:17.164498
149	3	3	LAB COMMUNITY CENTRE - PANEMAN	DEPT-00148	\N	2	t	f	2026-06-03 11:00:17.181127
150	3	3	LABORATORY	DEPT-00149	\N	2	t	f	2026-06-03 11:00:17.198001
151	3	3	LABOUR ROOM	DEPT-00150	\N	2	t	f	2026-06-03 11:00:17.214432
152	3	3	MICROBIOLOGY	DEPT-00151	\N	2	t	f	2026-06-03 11:00:17.23138
153	3	3	MICROBIOLOGY MEDICAL COLLEGE	DEPT-00152	\N	2	t	f	2026-06-03 11:00:17.247973
154	3	3	ONCOPATHOLOGY-LAB	DEPT-00153	\N	2	t	f	2026-06-03 11:00:17.264616
155	3	3	PCR LAB	DEPT-00154	\N	2	t	f	2026-06-03 11:00:17.286265
156	3	3	SKILL LAB FOR JEEVA RAKSHA WORKSHOP	DEPT-00155	\N	2	t	f	2026-06-03 11:00:17.301754
157	3	3	DEAN OFFICE,	DEPT-00156	\N	2	t	f	2026-06-03 11:00:17.316272
158	3	3	FRONT OFFICE	DEPT-00157	\N	2	t	f	2026-06-03 11:00:17.333113
159	3	3	MATRON OFFICE	DEPT-00158	\N	2	t	f	2026-06-03 11:00:17.349978
160	3	3	MEDICAL DIRECTOR	DEPT-00159	\N	2	t	f	2026-06-03 11:00:17.366563
161	3	3	MEDICAL SUPERINTENDENT OFFICE	DEPT-00160	\N	2	t	f	2026-06-03 11:00:17.38607
162	3	3	MS OFFICE AJIMS	DEPT-00161	\N	2	t	f	2026-06-03 11:00:17.401641
163	3	3	NURSING SUPERINTENDENT	DEPT-00162	\N	2	t	f	2026-06-03 11:00:17.416557
164	3	3	PHYSICAL EDUCATIONAL DIRECTOR	DEPT-00163	\N	2	t	f	2026-06-03 11:00:17.430658
165	3	3	PRINCIPLE OFFICE MEDICAL COLLEGE	DEPT-00164	\N	2	t	f	2026-06-03 11:00:17.445527
166	3	3	TRUST OFFICE	DEPT-00165	\N	2	t	f	2026-06-03 11:00:17.458266
167	3	3	CARDIOLOGY OPD	DEPT-00166	\N	2	t	f	2026-06-03 11:00:17.475391
168	3	3	Dental OPD	DEPT-00167	\N	2	t	f	2026-06-03 11:00:17.49242
169	3	3	DERMOTOLOGY OPD	DEPT-00168	\N	2	t	f	2026-06-03 11:00:17.508704
170	3	3	ENT OPD	DEPT-00169	\N	2	t	f	2026-06-03 11:00:17.52544
171	3	3	MEDICINE OPD	DEPT-00170	\N	2	t	f	2026-06-03 11:00:17.54261
172	3	3	NEPHROLOGY OPD	DEPT-00171	\N	2	t	f	2026-06-03 11:00:17.555547
173	3	3	NEUROLOGY OPD	DEPT-00172	\N	2	t	f	2026-06-03 11:00:17.578218
174	3	3	OBG OPD	DEPT-00173	\N	2	t	f	2026-06-03 11:00:17.594645
175	3	3	OPD	DEPT-00174	\N	2	t	f	2026-06-03 11:00:17.611367
176	3	3	OPD Medical College	DEPT-00175	\N	2	t	f	2026-06-03 11:00:17.628111
177	3	3	OPD MEDICAL COLLEGE FREE	DEPT-00176	\N	2	t	f	2026-06-03 11:00:17.644449
178	3	3	OPD RECEPTION	DEPT-00177	\N	2	t	f	2026-06-03 11:00:17.656316
179	3	3	OPTHALMOLOGY OPD	DEPT-00178	\N	2	t	f	2026-06-03 11:00:17.677852
180	3	3	ORTHOPAEDIC OPD	DEPT-00179	\N	2	t	f	2026-06-03 11:00:17.69476
181	3	3	PEADATRIC OPD	DEPT-00180	\N	2	t	f	2026-06-03 11:00:17.706376
182	3	3	PSYCHIATRY OPD	DEPT-00181	\N	2	t	f	2026-06-03 11:00:17.728669
183	3	3	RESPIRATORY OPD	DEPT-00182	\N	2	t	f	2026-06-03 11:00:17.744598
184	3	3	SUPER SPECIALITY OPD	DEPT-00183	\N	2	t	f	2026-06-03 11:00:17.755806
185	3	3	SURGERY OPD	DEPT-00184	\N	2	t	f	2026-06-03 11:00:17.771774
186	3	3	UROLOGY OPD	DEPT-00185	\N	2	t	f	2026-06-03 11:00:17.780543
187	3	3	HAEMOTOLOGY	DEPT-00186	\N	2	t	f	2026-06-03 11:00:17.788334
188	3	3	MAJOR OT	DEPT-00187	\N	2	t	f	2026-06-03 11:00:17.797043
189	3	3	MINOR OPERATION THEATRE	DEPT-00188	\N	2	t	f	2026-06-03 11:00:17.810851
190	3	3	MINOR OT	DEPT-00189	\N	2	t	f	2026-06-03 11:00:17.827798
191	3	3	OT- PLASTIC SURGERY	DEPT-00190	\N	2	t	f	2026-06-03 11:00:17.844984
192	3	3	OT SUB STORE	DEPT-00191	\N	2	t	f	2026-06-03 11:00:17.857999
193	3	3	OT-NEURO	DEPT-00192	\N	2	t	f	2026-06-03 11:00:17.8749
194	3	3	OT-ORTHO	DEPT-00193	\N	2	t	f	2026-06-03 11:00:17.891838
195	3	3	OT-UROLOGY	DEPT-00194	\N	2	t	f	2026-06-03 11:00:17.911585
196	3	3	PHYSIOTHERAPY	DEPT-00195	\N	2	t	f	2026-06-03 11:00:17.928567
197	3	3	PHYSIOTHERAPY COLLEGE	DEPT-00196	\N	2	t	f	2026-06-03 11:00:17.939468
198	3	3	IP GENERIC PHARMACY MAIN STORE	DEPT-00197	\N	2	t	f	2026-06-03 11:00:17.953819
199	3	3	IP PHARMACY MAIN STORE	DEPT-00198	\N	2	t	f	2026-06-03 11:00:17.961658
200	3	3	PHARMACY MAIN STORE	DEPT-00199	\N	2	t	f	2026-06-03 11:00:17.970063
201	3	3	102 WARD	DEPT-00200	\N	3	t	f	2026-06-03 11:00:17.978618
202	3	3	103 WARD	DEPT-00201	\N	3	t	f	2026-06-03 11:00:17.986589
203	3	3	104 WARD	DEPT-00202	\N	3	t	f	2026-06-03 11:00:17.995002
204	3	3	105 WARD	DEPT-00203	\N	3	t	f	2026-06-03 11:00:18.003319
205	3	3	106 WARD	DEPT-00204	\N	3	t	f	2026-06-03 11:00:18.011668
206	3	3	107 WARD	DEPT-00205	\N	3	t	f	2026-06-03 11:00:18.020052
207	3	3	108 WARD	DEPT-00206	\N	3	t	f	2026-06-03 11:00:18.028706
208	3	3	109 WARD	DEPT-00207	\N	3	t	f	2026-06-03 11:00:18.036789
209	3	3	110 WARD	DEPT-00208	\N	3	t	f	2026-06-03 11:00:18.045001
210	3	3	111 WARD	DEPT-00209	\N	3	t	f	2026-06-03 11:00:18.053374
211	3	3	112 WARD	DEPT-00210	\N	3	t	f	2026-06-03 11:00:18.062208
212	3	3	2 ND FLOOR SPECIAL WARD	DEPT-00211	\N	3	t	f	2026-06-03 11:00:18.071363
213	3	3	201 WARD	DEPT-00212	\N	3	t	f	2026-06-03 11:00:18.081146
214	3	3	202 WARD	DEPT-00213	\N	3	t	f	2026-06-03 11:00:18.097764
215	3	3	203 WARD	DEPT-00214	\N	3	t	f	2026-06-03 11:00:18.119491
216	3	3	204 WARD	DEPT-00215	\N	3	t	f	2026-06-03 11:00:18.136489
217	3	3	205 WARD	DEPT-00216	\N	3	t	f	2026-06-03 11:00:18.151961
218	3	3	206 WARD	DEPT-00217	\N	3	t	f	2026-06-03 11:00:18.166609
219	3	3	207 WARD	DEPT-00218	\N	3	t	f	2026-06-03 11:00:18.183203
220	3	3	208 WARD	DEPT-00219	\N	3	t	f	2026-06-03 11:00:18.198865
221	3	3	209 WARD	DEPT-00220	\N	3	t	f	2026-06-03 11:00:18.219612
222	3	3	210 WARD	DEPT-00221	\N	3	t	f	2026-06-03 11:00:18.236501
223	3	3	212WARD	DEPT-00222	\N	3	t	f	2026-06-03 11:00:18.251963
224	3	3	213 WARD	DEPT-00223	\N	3	t	f	2026-06-03 11:00:18.266663
225	3	3	214 WARD	DEPT-00224	\N	3	t	f	2026-06-03 11:00:18.283123
226	3	3	215 WARD	DEPT-00225	\N	3	t	f	2026-06-03 11:00:18.298787
227	3	3	216 WARD	DEPT-00226	\N	3	t	f	2026-06-03 11:00:18.319595
228	3	3	217 WARD	DEPT-00227	\N	3	t	f	2026-06-03 11:00:18.336571
229	3	3	401 WARD	DEPT-00228	\N	3	t	f	2026-06-03 11:00:18.352028
230	3	3	402 WARD	DEPT-00229	\N	3	t	f	2026-06-03 11:00:18.366949
231	3	3	403 WARD	DEPT-00230	\N	3	t	f	2026-06-03 11:00:18.383355
232	3	3	404 WARD	DEPT-00231	\N	3	t	f	2026-06-03 11:00:18.400347
233	3	3	405 WARD	DEPT-00232	\N	3	t	f	2026-06-03 11:00:18.420069
234	3	3	406 WARD	DEPT-00233	\N	3	t	f	2026-06-03 11:00:18.436603
235	3	3	4TH FLOOR ASHRAMA WARD	DEPT-00234	\N	3	t	f	2026-06-03 11:00:18.44901
236	3	3	4TH FLOOR SPECIAL WARD	DEPT-00235	\N	3	t	f	2026-06-03 11:00:18.462375
237	3	3	4TH FLOOR WARD	DEPT-00236	\N	3	t	f	2026-06-03 11:00:18.470603
238	3	3	ASHRAMA WARD 2 ND FLOOR	DEPT-00237	\N	3	t	f	2026-06-03 11:00:18.479049
239	3	3	CARDIAC WARD 217	DEPT-00238	\N	3	t	f	2026-06-03 11:00:18.487269
240	3	3	CASUALITY OBSERVATION WARD	DEPT-00239	\N	3	t	f	2026-06-03 11:00:18.49545
241	3	3	COVID-19 WARD	DEPT-00240	\N	3	t	f	2026-06-03 11:00:18.504025
242	3	3	ENT WARD	DEPT-00241	\N	3	t	f	2026-06-03 11:00:18.512424
243	3	3	FEMALE MEDICINE WARD-110	DEPT-00242	\N	3	t	f	2026-06-03 11:00:18.520617
244	3	3	FEMALE ORTHO SURGERY WARD-111	DEPT-00243	\N	3	t	f	2026-06-03 11:00:18.529448
245	3	3	FEMALE SURGERY WARD-108	DEPT-00244	\N	3	t	f	2026-06-03 11:00:18.537619
246	3	3	MALE MEDICINE WARD-216	DEPT-00245	\N	3	t	f	2026-06-03 11:00:18.545536
247	3	3	MALE ORTHO WARD 109	DEPT-00246	\N	3	t	f	2026-06-03 11:00:18.554182
248	3	3	MALE SURGERY WARD-210	DEPT-00247	\N	3	t	f	2026-06-03 11:00:18.562088
249	3	3	OBG WARD	DEPT-00248	\N	3	t	f	2026-06-03 11:00:18.570579
250	3	3	OBSERVATION WARD -17	DEPT-00249	\N	3	t	f	2026-06-03 11:00:18.579109
251	3	3	OBSERVATION WARD -18	DEPT-00250	\N	3	t	f	2026-06-03 11:00:18.587369
252	3	3	OPTHALMOLOGY WARD	DEPT-00251	\N	3	t	f	2026-06-03 11:00:18.595433
253	3	3	PAEDIATRIC WARD	DEPT-00252	\N	3	t	f	2026-06-03 11:00:18.604028
254	3	3	PSYCHIATRY WARD 214 & 215	DEPT-00253	\N	3	t	f	2026-06-03 11:00:18.612177
255	3	3	RESPIRATORY WARD	DEPT-00254	\N	3	t	f	2026-06-03 11:00:18.620766
256	3	3	SPECIAL WARD	DEPT-00255	\N	3	t	f	2026-06-03 11:00:18.629406
257	3	3	SPECIAL WARD 1ST. FLOOR	DEPT-00256	\N	3	t	f	2026-06-03 11:00:18.637557
258	3	3	SRD FLOOR SPECIAL WARD	DEPT-00257	\N	3	t	f	2026-06-03 11:00:18.645612
259	3	3	WARD SECRATORY	DEPT-00258	\N	3	t	f	2026-06-03 11:00:18.654029
4	3	3	PURCHASE	DEPT-00003	\N	1	t	f	2026-06-01 16:57:14.985075
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
4	3	3	ROOM	RM	3
6	3	3	DEPARTMENT	DEPT	258
11	3	3	ISSUE	ISS	27
5	3	3	INDENT	IND	32
17	3	3	MATERIAL	MAT	36
12	3	3	PURCHASE_REQUEST	PR	23
16	3	3	QUOTATION_REQUEST	QR	20
18	3	3	CATEGORY	CAT	10
19	3	3	VENDOR	VND	10
26	3	3	GATEPASS	GP	2
31	3	3	COMPANY_ADDRESS	ADDR	3
13	3	3	PURCHASE_ORDER	PO	39
27	2	2	ORGANIZATION	ORG	1
28	2	2	PROJECT	PROJ	1
15	3	3	GRN	GRN	18
25	3	3	RETURN	RET	7
14	3	3	GATE_ENTRY	GE	24
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
14	3	3	Floor 5	5	1	t	f	2026-06-03 13:09:42.497072
15	3	3	Floor 3	3	2	t	f	2026-06-03 13:09:42.662227
16	3	3	Floor 4	4	2	t	f	2026-06-03 13:09:42.662241
17	3	3	Floor 5	5	2	t	f	2026-06-03 13:09:42.662246
18	3	3	Floor 2	2	3	t	f	2026-06-03 13:09:42.879157
19	3	3	Floor 3	3	3	t	f	2026-06-03 13:09:42.879177
20	3	3	Floor 4	4	3	t	f	2026-06-03 13:09:42.879184
21	3	3	Floor 5	5	3	t	f	2026-06-03 13:09:42.87919
22	3	3	Floor 6	6	3	t	f	2026-06-03 13:09:42.879196
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
183	3	3	GE-00018	167267	53	\N	\N	\N	\N	2026-06-02 12:17:28.628437		\N	Ramc	Direct Invoice	\N	/uploads/invoices/3/20260602_064725_aad44eed.png		Awaiting Direct GRN	4	f	2026-06-02 12:17:28.633357
185	3	3	GE-00020		52	184	1	246	147	2026-06-02 12:32:14.875097		\N	Akbar	Carry on hand	\N	/uploads/invoices/3/20260602_070133_5d5c0dd4.png		Completed	4	f	2026-06-02 12:32:14.876346
184	3	3	GE-00019	23782	54	189	1	224	100	2026-06-02 12:28:26.738356	Suresh	\N		Vehicle	\N	/uploads/invoices/3/20260602_065717_fce2f380.png		Completed	4	f	2026-06-02 12:28:26.743214
186	3	3	GE-00021	Ka7982	52	183	1	225	185	2026-06-02 18:14:16.578833	Test	\N		Vehicle	\N	/uploads/invoices/3/20260602_124341_aecb6b5f.png		Awaiting GRN	4	f	2026-06-02 18:14:16.581254
187	3	3	GE-00022		\N	\N	1	\N	\N	2026-06-02 18:29:58.082946		\N	WWEEDD	Carry on hand	\N	/uploads/invoices/3/20260602_125424_ff02de50.pdf		Gate Entry Created	4	f	2026-06-02 18:29:58.084494
188	3	3	GE-00023		\N	\N	1	\N	\N	2026-06-02 18:34:35.142102		\N	Charan	Carry on hand	\N	/uploads/invoices/3/20260602_130433_be899148.png		Gate Entry Created	4	f	2026-06-02 18:34:35.142668
189	3	3	GE-00024		53	\N	\N	\N	\N	2026-06-02 18:35:30.858193		\N		Direct Invoice	\N	/uploads/invoices/3/20260602_130522_f8a7b3f2.png		Awaiting Direct GRN	4	f	2026-06-02 18:35:30.859342
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
182	3	3	GRN-00017	184	185	48	1	52	PO-Based		\N	81643.41	\N	\N	81643.41	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-06-02 18:01:24.056047	2026-06-02 12:31:24.097066	\N
183	3	3	GRN-00018	189	184	59	1	54	PO-Based		\N	33629	\N	\N	33629	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-06-02 18:01:36.945004	2026-06-02 12:31:36.974354	\N
184	3	3	GRN-00001	170	168	58	1	54	PO-Based	INV-123	2026-05-15	59200.07	\N	\N	59200.07	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.7739	2026-05-15 18:52:30.7739	\N
185	3	3	GRN-00002	171	169	54	1	53	PO-Based	INV-246	2026-05-15	90906.98	\N	\N	90906.98	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.783608	2026-05-15 18:52:30.783608	\N
186	3	3	GRN-00003	172	170	59	1	54	PO-Based	INV-369	2026-05-15	41190.86	\N	\N	41190.86	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.792942	2026-05-15 18:52:30.792942	\N
187	3	3	GRN-00004	173	171	53	1	51	PO-Based	INV-492	2026-05-15	158701.26	\N	\N	158701.26	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.801702	2026-05-15 18:52:30.801702	\N
188	3	3	GRN-00005	174	172	51	1	59	PO-Based	INV-615	2026-05-15	94040.79	\N	\N	94040.79	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.813547	2026-05-15 18:52:30.813547	\N
189	3	3	GRN-00006	175	173	48	1	60	PO-Based	INV-738	2026-05-15	106459.08	\N	\N	106459.08	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.824516	2026-05-15 18:52:30.824516	\N
190	3	3	GRN-00007	176	174	54	1	56	PO-Based	INV-861	2026-05-15	154430.82	\N	\N	154430.82	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.831705	2026-05-15 18:52:30.831705	\N
191	3	3	GRN-00008	177	175	59	1	52	PO-Based	INV-984	2026-05-15	65341.82	\N	\N	65341.82	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.841674	2026-05-15 18:52:30.841674	\N
192	3	3	GRN-00009	178	176	60	1	60	PO-Based	INV-1107	2026-05-15	147399.29	\N	\N	147399.29	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.849446	2026-05-15 18:52:30.849446	\N
193	3	3	GRN-00010	179	177	54	1	60	PO-Based	INV-1230	2026-05-15	85728.48	\N	\N	85728.48	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.859075	2026-05-15 18:52:30.859075	\N
194	3	3	GRN-00011	180	178	55	1	58	PO-Based	INV-1353	2026-05-15	30270.67	\N	\N	30270.67	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.866763	2026-05-15 18:52:30.866763	\N
195	3	3	GRN-00012	181	179	58	1	53	PO-Based	INV-1476	2026-05-15	62495.91	\N	\N	62495.91	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.874545	2026-05-15 18:52:30.874545	\N
196	3	3	GRN-00013	182	180	48	1	55	PO-Based	INV-1599	2026-05-15	75249.7	\N	\N	75249.7	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.883845	2026-05-15 18:52:30.883845	\N
197	3	3	GRN-00014	183	181	47	1	52	PO-Based	INV-1722	2026-05-15	19438.81	\N	\N	19438.81	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.894827	2026-05-15 18:52:30.894827	\N
198	3	3	GRN-00015	184	182	46	1	52	PO-Based	INV-1845	2026-05-15	40821.7	\N	\N	40821.7	0	0	0	0	\N	Not Applicable	Completed	\N	4	f	2026-05-15 18:52:30.902895	2026-05-15 18:52:30.902895	\N
\.


--
-- Data for Name: grn_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grn_items (id, grn_id, material_id, po_item_id, ordered_quantity, received_quantity, accepted_quantity, rejected_quantity, rate, hsn_code, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, taxable_amount, discount_percent, remarks) FROM stdin;
463	182	246	463	93	93	93	0	501.93	\N	0	0	0	0	0	0	46679.49	0	\N
464	182	232	464	54	54	54	0	647.48	\N	0	0	0	0	0	0	34963.92	0	\N
465	183	224	476	100	100	100	0	336.29	\N	0	0	0	0	0	0	33629	0	\N
466	184	218	429	58	58	58	0	622.66	\N	0	0	0	0	0	0	36114.28	0	\N
467	184	239	430	91	91	91	0	253.69	\N	0	0	0	0	0	0	23085.79	0	\N
468	185	232	431	65	65	65	0	798.18	\N	0	0	0	0	0	0	51881.7	0	\N
469	185	240	432	56	56	56	0	696.88	\N	0	0	0	0	0	0	39025.28	0	\N
470	186	246	433	84	84	84	0	197.82	\N	0	0	0	0	0	0	16616.88	0	\N
471	186	238	434	97	97	97	0	253.34	\N	0	0	0	0	0	0	24573.98	0	\N
472	187	230	435	62	62	62	0	192.3	\N	0	0	0	0	0	0	11922.6	0	\N
473	187	243	436	90	90	90	0	994.43	\N	0	0	0	0	0	0	89498.7	0	\N
474	187	238	437	71	71	71	0	806.76	\N	0	0	0	0	0	0	57279.96	0	\N
475	188	224	438	71	71	71	0	334.92	\N	0	0	0	0	0	0	23779.32	0	\N
476	188	246	439	56	56	56	0	508.97	\N	0	0	0	0	0	0	28502.32	0	\N
477	188	242	440	95	95	95	0	439.57	\N	0	0	0	0	0	0	41759.15	0	\N
478	189	232	441	74	74	74	0	675.81	\N	0	0	0	0	0	0	50009.94	0	\N
479	189	246	442	89	89	89	0	634.26	\N	0	0	0	0	0	0	56449.14	0	\N
480	190	232	443	85	85	85	0	594.08	\N	0	0	0	0	0	0	50496.8	0	\N
481	190	247	444	64	64	64	0	701.45	\N	0	0	0	0	0	0	44892.8	0	\N
482	190	228	445	83	83	83	0	711.34	\N	0	0	0	0	0	0	59041.22	0	\N
483	191	218	446	74	74	74	0	647.16	\N	0	0	0	0	0	0	47889.84	0	\N
484	191	225	447	91	91	91	0	191.78	\N	0	0	0	0	0	0	17451.98	0	\N
485	192	233	448	95	95	95	0	935.31	\N	0	0	0	0	0	0	88854.45	0	\N
486	192	234	449	92	92	92	0	432.83	\N	0	0	0	0	0	0	39820.36	0	\N
487	192	226	450	68	68	68	0	275.36	\N	0	0	0	0	0	0	18724.48	0	\N
488	193	241	451	78	78	78	0	264.13	\N	0	0	0	0	0	0	20602.14	0	\N
489	193	225	452	69	69	69	0	943.86	\N	0	0	0	0	0	0	65126.34	0	\N
490	194	233	453	53	26.5	26.5	0	539.98	\N	0	0	0	0	0	0	14309.47	0	\N
491	194	239	454	60	30	30	0	532.04	\N	0	0	0	0	0	0	15961.2	0	\N
492	195	230	455	97	48.5	48.5	0	962.72	\N	0	0	0	0	0	0	46691.92	0	\N
493	195	223	456	64	32	32	0	229.87	\N	0	0	0	0	0	0	7355.84	0	\N
494	195	249	457	83	41.5	41.5	0	203.57	\N	0	0	0	0	0	0	8448.15	0	\N
495	196	224	458	72	36	36	0	549.16	\N	0	0	0	0	0	0	19769.76	0	\N
496	196	220	459	97	48.5	48.5	0	654.04	\N	0	0	0	0	0	0	31720.94	0	\N
497	196	218	460	50	25	25	0	950.36	\N	0	0	0	0	0	0	23759	0	\N
498	197	225	461	99	49.5	49.5	0	184.01	\N	0	0	0	0	0	0	9108.49	0	\N
499	197	216	462	86	43	43	0	240.24	\N	0	0	0	0	0	0	10330.32	0	\N
500	198	246	463	93	46.5	46.5	0	501.93	\N	0	0	0	0	0	0	23339.74	0	\N
501	198	232	464	54	27	27	0	647.48	\N	0	0	0	0	0	0	17481.96	0	\N
\.


--
-- Data for Name: indent_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.indent_approvals (id, indent_id, approval_flow_id, approver_id, approved_at) FROM stdin;
1	201	3	4	2026-06-01 16:56:53.341524
2	202	3	4	2026-06-01 17:02:07.228679
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
477	205	1099	2	0	0
458	195	224	100	0	0
478	205	217	3	0	0
459	196	222	25	0	0
460	196	232	40	40	0
461	197	244	2	0	0
462	198	226	12	0	0
463	199	234	50	50	0
464	199	244	4	4	0
465	200	244	5	0	0
466	201	219	120	0	0
467	202	219	300	0	0
468	203	224	6	0	0
469	203	224	3	0	0
470	203	238	3	0	0
471	203	224	2	0	0
472	203	224	5	0	0
473	203	224	5	0	0
474	203	246	5	0	0
426	182	225	25	25	25
427	182	238	21	21	21
457	194	224	100	5	5
436	186	242	19	19	19
475	204	1057	5	0	0
476	204	1062	5	0	0
\.


--
-- Data for Name: indents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.indents (id, tenant_id, site_id, indent_number, requester_id, room_id, building_id, floor, location, department, remarks, total_amount, status, current_approval_level, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
199	3	3	IND-00026	9	3	1	Floor 3	Room31	ADMIN		5450	Issued	1	\N	2026-06-01 09:26:21.313376	f	2026-06-01 14:51:39.482646	2026-06-01 14:57:06.725872
197	3	3	IND-00024	9	1	1	Ground Floor	Room1	CIVIL		1100	Converted to PO	1	\N	2026-06-01 07:30:22.172181	f	2026-06-01 12:46:09.107484	2026-06-01 16:03:23.72615
196	3	3	IND-00023	4	1	1	Ground Floor	Room1	CIVIL		13325	Converted to PO	1	\N	2026-05-26 12:55:06.808856	f	2026-05-26 18:24:51.88147	2026-06-01 16:36:50.181893
198	3	3	IND-00025	9	1	1	Ground Floor	Room1	CIVIL		11400	Approved	1	\N	2026-06-01 11:12:10.805868	f	2026-06-01 13:04:34.087373	2026-06-01 16:42:10.806351
201	3	3	IND-00028	4	1	1	Ground Floor	Room1	CIVIL		96000	Converted to PO	1	4	2026-06-01 11:26:53.378164	f	2026-06-01 16:41:16.232062	2026-06-01 16:58:23.602685
188	3	3	IND-00010	4	1	1	Floor 1	\N	Civil	\N	0	Converted to PO	1	\N	\N	f	2026-04-20 18:52:30.375564	2026-05-20 11:09:40.430772
186	3	3	IND-00008	4	1	1	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-19 18:52:30.375564	2026-05-20 11:11:02.774926
195	3	3	IND-00022	4	2	1	Floor 1	Room1	CIVIL	General	6500000	Converted to PO	1	\N	2026-05-20 07:13:59.374666	f	2026-05-20 12:43:53.178501	2026-05-20 12:44:10.337933
194	3	3	IND-00021	4	2	1	Floor 1	Room1	CIVIL		6500000	Partially Issued	1	\N	2026-05-26 09:56:13.62006	f	2026-05-20 10:55:54.69627	2026-05-26 17:33:32.452744
182	3	3	IND-00004	4	2	3	Floor 1	\N	Civil	\N	0	Issued	1	\N	\N	f	2026-04-17 18:52:30.375564	2026-05-26 18:19:24.672223
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
193	3	3	IND-00015	4	1	2	Floor 1	\N	Civil	\N	0	Approved	1	\N	2026-06-01 11:32:27.323138	f	2026-04-23 06:52:30.375564	2026-06-01 17:02:27.324977
202	3	3	IND-00029	4	1	1	Ground Floor	Room1	CIVIL		240000	Converted to PO	1	4	2026-06-01 11:32:07.268603	f	2026-06-01 17:02:01.395733	2026-06-01 17:07:09.000518
200	3	3	IND-00027	9	3	1	Floor 3	Room31	ADMIN		2750	Converted to PO	1	\N	2026-06-01 11:12:34.506509	f	2026-06-01 16:00:02.887037	2026-06-02 13:18:45.622315
203	3	3	IND-00030	9	2	1	Floor 2	Room1	CIVIL	Ggggh	1569000	Awaiting Approval	1	\N	\N	f	2026-06-02 13:46:47.613015	2026-06-02 13:46:47.613056
204	3	3	IND-00031	4	17	1	Ground Floor	Room 015	ANATOMY		44928.05	Awaiting Approval	1	\N	\N	f	2026-06-03 13:16:47.251194	2026-06-03 13:16:47.25123
205	3	3	IND-00032	4	91	2	1	Room 103	LABOUR ROOM		8014.08	Awaiting Approval	1	\N	\N	f	2026-06-03 13:24:54.10457	2026-06-03 13:24:54.104593
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, material_id, description, hsn_sac, quantity, rate, uom, discount_percent, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, taxable_amount, amount, remarks) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, tenant_id, site_id, invoice_number, invoice_date, gate_entry_id, vendor_id, po_id, total_amount, tax_amount, status, scan_url, remarks, created_by_id, is_deleted, created_at, updated_at, eway_bill_number, delivery_note, delivery_note_date, payment_terms, reference_number, reference_date, dispatch_doc_number, dispatched_through, destination, lr_rr_number, vehicle_number, terms_of_delivery, total_taxable_amount, total_cgst, total_sgst, total_igst, total_discount, consignee_id, buyer_id, internal_reference_number, srf_number, irn, ack_number, ack_date, transport_charges, transport_hsn, transport_cgst_rate, transport_sgst_rate, transport_igst_rate, transport_discount_percent, code) FROM stdin;
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
188	211	234	50	65	\N
189	212	244	4	550	\N
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
210	3	3	ISS-00025	50	1	196	1	1	CIVIL	\N	Fulfillment for IND-00023	Completed	4	\N	f	\N	\N	\N	f	2026-05-26 18:25:34.285748
211	3	3	ISS-00026	54	1	199	1	3	ADMIN	\N	Fulfillment for IND-00026	Completed	4	\N	f	\N	\N	\N	f	2026-06-01 14:57:06.593084
212	3	3	ISS-00027	55	1	199	1	3	ADMIN	\N	Fulfillment for IND-00026	Completed	4	\N	f	\N	\N	\N	f	2026-06-01 14:57:06.70319
209	3	3	ISS-00024	50	1	182	3	2	CIVIL	\N	Fulfillment for IND-00004	Completed	4	\N	t	2026-06-02 08:17:09.301701	9	\N	f	2026-05-26 18:19:24.650895
208	3	3	ISS-00023	46	1	182	3	2	CIVIL	\N	Fulfillment for IND-00004	Completed	4	\N	t	2026-06-02 08:17:11.419923	9	\N	f	2026-05-26 18:18:05.503323
207	3	3	ISS-00022	46	1	194	1	2	CIVIL	\N	Fulfillment for IND-00021	Completed	4	\N	t	2026-06-02 08:17:12.594518	9	\N	f	2026-05-26 17:33:32.403852
206	3	3	ISS-00021	52	1	186	1	1	CIVIL	\N	Fulfillment for IND-00008	Completed	4	\N	t	2026-06-02 08:17:15.451563	9	\N	f	2026-05-20 11:11:02.769222
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
7	16	222	2	Usable	Not used
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
16	3	3	RET-00007	59	1	\N	CIVIL	Unused		Pradnesh	4	f	2026-06-02 18:31:45.238038
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materials (id, tenant_id, site_id, code, name, category_id, subcategory_id, uom_id, reorder_level, maximum_level, standard_cost, preferred_vendor_id, storage_type, hsn_code, gst_rate, material_type, description, is_active, is_deleted, created_at, updated_at, warehouse_id, alias, reference_no) FROM stdin;
965	3	3	MAT-00037	AB15 APEX 4LTR	51	13	21	37	102	4352.49	\N	Covered	\N	18	Consumable	AB15 APEX 4LTR	t	f	2026-06-03 12:31:53.851681	2026-06-03 12:31:53.851695	46	\N	CIV0001
217	3	3	MAT-00002	Concrete Curing Agent	41	\N	7	50	152	150	59	Covered	\N	18	Consumable	Liquid curing compound for moisture retention in concrete.	t	f	2026-05-15 15:19:36.653752	2026-05-15 15:19:36.653761	46	\N	\N
218	3	3	MAT-00003	Plywood 18mm	50	\N	10	500	2329	110	58	Covered	\N	18	Consumable	Commercial grade MR plywood for shuttering and furniture.	t	f	2026-05-15 15:19:36.6582	2026-05-15 15:19:36.658211	46	\N	\N
219	3	3	MAT-00004	M-Sand	42	\N	3	80	305	800	59	Open Yard	\N	5	Consumable	Manufactured sand as an eco-friendly alternative to river sand.	t	f	2026-05-15 15:19:36.660714	2026-05-15 15:19:36.660724	54	\N	\N
220	3	3	MAT-00005	Iron Pickaxe	48	\N	5	30	105	650	51	Warehouse	\N	18	Non-Consumable	Double-headed pickaxe for hard soil excavation.	t	f	2026-05-15 15:19:36.663008	2026-05-15 15:19:36.663017	47	\N	\N
221	3	3	MAT-00006	Safety Shoes	48	\N	15	50	193	1200	51	Warehouse	\N	18	Consumable	Steel-toe safety shoes for site engineers and workers.	t	f	2026-05-15 15:19:36.665184	2026-05-15 15:19:36.665193	52	\N	\N
222	3	3	MAT-00007	Binding Wire	43	\N	6	50	165	85	60	Covered	\N	18	Consumable	Annealed binding wire for securing reinforcement bars.	t	f	2026-05-15 15:19:36.667488	2026-05-15 15:19:36.667497	47	\N	\N
223	3	3	MAT-00008	Steel Shovel	48	\N	5	50	244	450	59	Warehouse	\N	18	Non-Consumable	Heavy-duty steel shovel with wooden handle.	t	f	2026-05-15 15:19:36.669739	2026-05-15 15:19:36.669748	47	\N	\N
224	3	3	MAT-00009	12mm TMT Bars	43	\N	2	10	43	65000	58	Open Yard	\N	18	Consumable	High-ductility TMT bars for reinforcement.	t	f	2026-05-15 15:19:36.671618	2026-05-15 15:19:36.671627	46	\N	\N
225	3	3	MAT-00010	Wall Putty 40kg	47	\N	1	30	91	750	58	Covered	\N	5	Consumable	White cement-based putty for wall leveling.	t	f	2026-05-15 15:19:36.673573	2026-05-15 15:19:36.673585	50	\N	\N
226	3	3	MAT-00011	Aggregates 20mm	42	\N	3	40	172	950	57	Open Yard	\N	5	Consumable	Crushed stone aggregates for structural concrete.	t	f	2026-05-15 15:19:36.675725	2026-05-15 15:19:36.675737	54	\N	\N
227	3	3	MAT-00012	Digital Theodolite	48	\N	5	1	5	85000	55	Warehouse	\N	18	Non-Consumable	Precision surveying instrument for angle measurement.	t	f	2026-05-15 15:19:36.67779	2026-05-15 15:19:36.6778	46	\N	\N
228	3	3	MAT-00013	Vitrified Tiles 600x600	49	\N	10	1000	3294	45	58	Covered	\N	18	Consumable	Double-charged vitrified tiles for flooring.	t	f	2026-05-15 15:19:36.679809	2026-05-15 15:19:36.679818	55	\N	\N
229	3	3	MAT-00014	Teak Wood Door 3x7	50	\N	5	20	82	12500	59	Covered	\N	18	Consumable	Solid teak wood main doors for apartments.	t	f	2026-05-15 15:19:36.681654	2026-05-15 15:19:36.681663	46	\N	\N
230	3	3	MAT-00015	Bosch Hand Grinder 4 inch	48	\N	5	5	20	4500	51	Warehouse	\N	18	Non-Consumable	Power tool for cutting and grinding steel/masonry.	t	f	2026-05-15 15:19:36.683571	2026-05-15 15:19:36.68358	47	\N	\N
231	3	3	MAT-00016	Screws 1 inch	48	\N	14	100	317	450	52	Warehouse	\N	18	Consumable	Zinc-coated wood screws for carpentry.	t	f	2026-05-15 15:19:36.685536	2026-05-15 15:19:36.685546	47	\N	\N
232	3	3	MAT-00017	Emulsion White Paint	47	\N	7	40	121	280	57	Covered	\N	18	Consumable	Premium interior emulsion for smooth wall finish.	t	f	2026-05-15 15:19:36.687479	2026-05-15 15:19:36.687491	50	\N	\N
233	3	3	MAT-00018	Heavy-duty Wheelbarrow	48	\N	5	20	76	4800	52	Open Yard	\N	18	Non-Consumable	Steel body wheelbarrow for material transport.	t	f	2026-05-15 15:19:36.689535	2026-05-15 15:19:36.689545	54	\N	\N
234	3	3	MAT-00019	AAC Blocks 4 inch	44	\N	5	2000	9155	65	52	Open Yard	\N	12	Consumable	Lightweight Autoclaved Aerated Concrete blocks.	t	f	2026-05-15 15:19:36.691671	2026-05-15 15:19:36.691684	54	\N	\N
235	3	3	MAT-00020	Water Tank 1000L	45	\N	5	10	44	6500	60	Open Yard	\N	18	Consumable	Triple-layered HDPE water storage tank.	t	f	2026-05-15 15:19:36.694238	2026-05-15 15:19:36.69425	49	\N	\N
236	3	3	MAT-00021	PVC Pipe 4 inch	45	\N	8	100	333	250	54	Covered	\N	18	Consumable	Heavy-duty PVC pipes for drainage systems.	t	f	2026-05-15 15:19:36.696337	2026-05-15 15:19:36.696346	49	\N	\N
237	3	3	MAT-00022	Ergonomic Office Chair	48	\N	5	10	38	6500	51	Warehouse	\N	18	Non-Consumable	High-back mesh chair for office comfort.	t	f	2026-05-15 15:19:36.698168	2026-05-15 15:19:36.698177	51	\N	\N
238	3	3	MAT-00023	16mm TMT Bars	43	\N	2	10	33	65000	60	Open Yard	\N	18	Consumable	High-tensile strength bars for heavy load structures.	t	f	2026-05-15 15:19:36.699987	2026-05-15 15:19:36.699996	46	\N	\N
239	3	3	MAT-00024	Concrete Mixer 10/7 CFT	48	\N	5	2	8	145000	54	Open Yard	\N	18	Non-Consumable	Diesel-powered concrete mixer for site works.	t	f	2026-05-15 15:19:36.701806	2026-05-15 15:19:36.701815	46	\N	\N
240	3	3	MAT-00025	LED Tube Light 20W	46	\N	5	50	165	350	56	Warehouse	\N	18	Consumable	Energy-saving LED tube lights for office and site.	t	f	2026-05-15 15:19:36.703642	2026-05-15 15:19:36.703651	48	\N	\N
241	3	3	MAT-00026	OPC 53 Grade Cement	41	\N	1	100	463	450	58	Covered	\N	18	Consumable	High-strength Ordinary Portland Cement for structural concrete.	t	f	2026-05-15 15:19:36.705493	2026-05-15 15:19:36.705502	46	\N	\N
242	3	3	MAT-00027	Fire Extinguisher 6kg ABC	48	\N	5	15	62	3500	59	Warehouse	\N	18	Non-Consumable	Dry powder fire extinguisher for site safety.	t	f	2026-05-15 15:19:36.707301	2026-05-15 15:19:36.707311	52	\N	\N
243	3	3	MAT-00028	Office Workstation Desk	50	\N	5	10	36	12000	52	Warehouse	\N	18	Non-Consumable	Modular workstation for site office staff.	t	f	2026-05-15 15:19:36.709167	2026-05-15 15:19:36.709176	51	\N	\N
244	3	3	MAT-00029	Adhesive for Tiles 20kg	49	\N	1	100	403	550	58	Covered	\N	18	Consumable	Polymer-modified tile adhesive for long-lasting bond.	t	f	2026-05-15 15:19:36.711085	2026-05-15 15:19:36.711094	55	\N	\N
245	3	3	MAT-00030	Stainless Steel Hinges	48	\N	15	200	864	120	51	Warehouse	\N	18	Consumable	Rust-free SS hinges for doors and windows.	t	f	2026-05-15 15:19:36.712919	2026-05-15 15:19:36.712928	47	\N	\N
246	3	3	MAT-00031	2.5sqmm Copper Wire	46	\N	12	20	90	1800	56	Warehouse	\N	18	Consumable	FRLS insulated copper wire for internal wiring.	t	f	2026-05-15 15:19:36.714732	2026-05-15 15:19:36.714741	48	\N	\N
247	3	3	MAT-00032	Safety Helmet	48	\N	5	100	375	250	51	Warehouse	\N	18	Consumable	Industrial safety helmets with adjustable straps.	t	f	2026-05-15 15:19:36.716525	2026-05-15 15:19:36.716534	52	\N	\N
248	3	3	MAT-00033	Makita Hammer Drill	48	\N	5	5	17	9200	53	Warehouse	\N	18	Non-Consumable	Heavy-duty rotary hammer drill for site installation.	t	f	2026-05-15 15:19:36.718318	2026-05-15 15:19:36.718326	47	\N	\N
249	3	3	MAT-00034	PPC Cement	41	\N	1	150	472	420	55	Covered	\N	18	Consumable	Portland Pozzolana Cement for plastering and masonry works.	t	f	2026-05-15 15:19:36.720105	2026-05-15 15:19:36.720114	46	\N	\N
250	3	3	MAT-00035	Fly Ash Bricks	44	\N	5	5000	17033	8	54	Open Yard	\N	5	Consumable	Uniform sized fly ash bricks for wall construction.	t	f	2026-05-15 15:19:36.721921	2026-05-15 15:19:36.721929	54	\N	\N
966	3	3	MAT-00038	SE2 SATIN 4 LTR	51	13	21	42	156	3701.64	\N	Covered	\N	18	Consumable	SE2 SATIN 4 LTR	t	f	2026-06-03 12:31:53.854528	2026-06-03 12:31:53.854541	46	\N	CIV0002
251	3	3	MAT-00036	Water Tank 500 ML	45	7	5	10	50	4000	\N	General		18	Consumable	Water Tank 500 ML	t	f	2026-06-01 16:46:02.462056	2026-06-01 16:46:02.462098	49	\N	\N
967	3	3	MAT-00039	SILVER GRAY APCO PREMIUM SATIN	51	13	7	263	539	398.32	\N	Covered	\N	18	Consumable	SILVER GRAY APCO PREMIUM SATIN	t	f	2026-06-03 12:31:53.859304	2026-06-03 12:31:53.859315	46	\N	CIV0003
216	3	3	MAT-00001	River Sand	42	5	3	50	176	1200	60	Open Yard		5	Consumable	Fine river sand for high-quality concrete and mortar.	t	f	2026-05-15 15:19:36.652101	2026-06-02 11:41:27.475981	54		
968	3	3	MAT-00040	AB2 Apex 1Ltr	51	13	7	360	1396	352.41	\N	Covered	\N	18	Consumable	AB2 Apex 1Ltr	t	f	2026-06-03 12:31:53.86212	2026-06-03 12:31:53.86213	46	\N	CIV0004
969	3	3	MAT-00041	AB2 APEX 20LTR	51	13	21	11	24	2912.11	\N	Covered	\N	18	Consumable	AB2 APEX 20LTR	t	f	2026-06-03 12:31:53.864933	2026-06-03 12:31:53.864942	46	\N	CIV0005
970	3	3	MAT-00042	TE3 TE 20 LTR	51	13	21	33	98	3375.74	\N	Covered	\N	18	Consumable	TE3 TE 20 LTR	t	f	2026-06-03 12:31:53.867275	2026-06-03 12:31:53.867283	46	\N	CIV0006
971	3	3	MAT-00043	AC2G ACE 4 LTR	51	13	21	32	125	1520.46	\N	Covered	\N	18	Consumable	AC2G ACE 4 LTR	t	f	2026-06-03 12:31:53.869789	2026-06-03 12:31:53.8698	46	\N	CIV0007
972	3	3	MAT-00044	ANTIQUE WHITE APCO PREMIUM SATIN	51	13	7	210	630	407.75	\N	Covered	\N	18	Consumable	ANTIQUE WHITE APCO PREMIUM SATIN	t	f	2026-06-03 12:31:53.872277	2026-06-03 12:31:53.872287	46	\N	CIV0008
973	3	3	MAT-00045	ANTIQUE WHITE-APCO PREMIUM  20 LTR	51	13	21	50	193	1822.17	\N	Covered	\N	18	Consumable	ANTIQUE WHITE-APCO PREMIUM  20 LTR	t	f	2026-06-03 12:31:53.874254	2026-06-03 12:31:53.874263	46	\N	CIV0009
974	3	3	MAT-00046	ANTYI WHITE APCO 20LTR PREMIUM ENAMA	51	13	21	50	115	3338.49	\N	Covered	\N	18	Consumable	ANTYI WHITE APCO 20LTR PREMIUM ENAMA	t	f	2026-06-03 12:31:53.876256	2026-06-03 12:31:53.876267	46	\N	CIV0010
975	3	3	MAT-00047	SE2 SATIN 20 LTR	51	13	21	41	164	2988.62	\N	Covered	\N	18	Consumable	SE2 SATIN 20 LTR	t	f	2026-06-03 12:31:53.878549	2026-06-03 12:31:53.878558	46	\N	CIV0011
976	3	3	MAT-00048	TE3 TE 20LTR	51	13	21	32	111	2818.46	\N	Covered	\N	18	Consumable	TE3 TE 20LTR	t	f	2026-06-03 12:31:53.880565	2026-06-03 12:31:53.880574	46	\N	CIV0012
977	3	3	MAT-00049	SE2 SATIN 20 Ltr	51	13	21	11	40	3598.42	\N	Covered	\N	18	Consumable	SE2 SATIN 20 Ltr	t	f	2026-06-03 12:31:53.882656	2026-06-03 12:31:53.882665	46	\N	CIV0013
978	3	3	MAT-00050	SE2 SATIN 4 Ltr	51	13	21	25	76	4446.17	\N	Covered	\N	18	Consumable	SE2 SATIN 4 Ltr	t	f	2026-06-03 12:31:53.884587	2026-06-03 12:31:53.884595	46	\N	CIV0014
979	3	3	MAT-00051	1 1/2 Cpvc NRV	51	13	5	335	748	726.57	\N	Covered	\N	18	Consumable	1 1/2 Cpvc NRV	t	f	2026-06-03 12:31:53.886773	2026-06-03 12:31:53.886783	46	\N	CIV0015
980	3	3	MAT-00052	1 1/4 Cpvc FTA	51	13	5	476	1591	769.59	\N	Covered	\N	18	Consumable	1 1/4 Cpvc FTA	t	f	2026-06-03 12:31:53.888905	2026-06-03 12:31:53.888913	46	\N	CIV0016
981	3	3	MAT-00053	1 1/4 CPVC PIPE	51	13	5	48	129	1209.93	\N	Covered	\N	18	Consumable	1 1/4 CPVC PIPE	t	f	2026-06-03 12:31:53.890852	2026-06-03 12:31:53.890861	46	\N	CIV0017
982	3	3	MAT-00054	1 1/4 CPVC UNION	51	13	5	44	171	1388.23	\N	Covered	\N	18	Consumable	1 1/4 CPVC UNION	t	f	2026-06-03 12:31:53.892745	2026-06-03 12:31:53.892754	46	\N	CIV0018
983	3	3	MAT-00055	1 Inch Square Bush	51	13	5	16	50	1097.1	\N	Covered	\N	18	Consumable	1 Inch Square Bush	t	f	2026-06-03 12:31:53.894824	2026-06-03 12:31:53.894833	46	\N	CIV0019
984	3	3	MAT-00056	1" COTTON ROLL	51	13	5	16	54	1217.73	\N	Covered	\N	18	Consumable	1" COTTON ROLL	t	f	2026-06-03 12:31:53.896716	2026-06-03 12:31:53.896725	46	\N	CIV0020
985	3	3	MAT-00057	1*3/4 BUSH	51	13	5	44	100	1116.03	\N	Covered	\N	18	Consumable	1*3/4 BUSH	t	f	2026-06-03 12:31:53.898764	2026-06-03 12:31:53.898773	46	\N	CIV0021
986	3	3	MAT-00058	1.25 Inch Round Bush	51	13	5	27	69	1224.33	\N	Covered	\N	18	Consumable	1.25 Inch Round Bush	t	f	2026-06-03 12:31:53.900721	2026-06-03 12:31:53.90073	46	\N	CIV0022
987	3	3	MAT-00059	1.25 Inch Square Ineer Bush	51	13	5	43	145	1205.51	\N	Covered	\N	18	Consumable	1.25 Inch Square Ineer Bush	t	f	2026-06-03 12:31:53.902751	2026-06-03 12:31:53.902763	46	\N	CIV0023
988	3	3	MAT-00060	12*13 SPANNER	51	13	5	37	128	1387.74	\N	Covered	\N	18	Non-Consumable	12*13 SPANNER	t	f	2026-06-03 12:31:53.904863	2026-06-03 12:31:53.904872	46	\N	CIV0024
989	3	3	MAT-00061	15 MTR TAPE	51	13	5	10	37	1327.65	\N	Covered	\N	18	Consumable	15 MTR TAPE	t	f	2026-06-03 12:31:53.906833	2026-06-03 12:31:53.906842	46	\N	CIV0025
990	3	3	MAT-00062	18*24 TARFAULIN	51	13	5	222	661	842.8	\N	Covered	\N	18	Consumable	18*24 TARFAULIN	t	f	2026-06-03 12:31:53.908721	2026-06-03 12:31:53.90873	46	\N	CIV0026
991	3	3	MAT-00063	2 Inch Brush	51	13	5	312	946	821.89	\N	Covered	\N	18	Consumable	2 Inch Brush	t	f	2026-06-03 12:31:53.910797	2026-06-03 12:31:53.910806	46	\N	CIV0027
992	3	3	MAT-00064	2" Magic Blue Brush	51	13	5	144	404	753.04	\N	Covered	\N	18	Consumable	2" Magic Blue Brush	t	f	2026-06-03 12:31:53.912765	2026-06-03 12:31:53.912774	46	\N	CIV0028
993	3	3	MAT-00065	2" SUNRISE BRUSH	51	13	5	63	170	779.97	\N	Covered	\N	18	Consumable	2" SUNRISE BRUSH	t	f	2026-06-03 12:31:53.91513	2026-06-03 12:31:53.915141	46	\N	CIV0029
994	3	3	MAT-00066	20 LTRS GEM YELLOW PRIMER	51	13	21	45	169	2034.97	\N	Covered	\N	18	Consumable	20 LTRS GEM YELLOW PRIMER	t	f	2026-06-03 12:31:53.917172	2026-06-03 12:31:53.917181	46	\N	CIV0030
995	3	3	MAT-00067	20*2.4 SUPER MASKING TAPE	51	13	5	133	499	868.39	\N	Covered	\N	18	Consumable	20*2.4 SUPER MASKING TAPE	t	f	2026-06-03 12:31:53.919329	2026-06-03 12:31:53.91934	46	\N	CIV0031
996	3	3	MAT-00068	SE13 SATIN 4 LTR	51	13	21	33	93	3740.9	\N	Covered	\N	18	Consumable	SE13 SATIN 4 LTR	t	f	2026-06-03 12:31:53.921548	2026-06-03 12:31:53.921557	46	\N	CIV0032
997	3	3	MAT-00069	MEHENDI-N  APCO PREMIUM  ENAMAl 4Ltrs	51	13	21	24	59	1911.19	\N	Covered	\N	18	Consumable	MEHENDI-N  APCO PREMIUM  ENAMAl 4Ltrs	t	f	2026-06-03 12:31:53.923477	2026-06-03 12:31:53.923485	46	\N	CIV0033
998	3	3	MAT-00070	25 X 4.8 Super Masking Tape 1 PC	51	13	5	344	1346	653.76	\N	Covered	\N	18	Consumable	25 X 4.8 Super Masking Tape 1 PC	t	f	2026-06-03 12:31:53.925388	2026-06-03 12:31:53.925397	46	\N	CIV0034
999	3	3	MAT-00071	2X1 CPVC TEE	51	13	5	50	157	579.36	\N	Covered	\N	18	Consumable	2X1 CPVC TEE	t	f	2026-06-03 12:31:53.927404	2026-06-03 12:31:53.927414	46	\N	CIV0035
1000	3	3	MAT-00072	3" SUNRISE BRUSH	51	13	5	146	337	875.24	\N	Covered	\N	18	Consumable	3" SUNRISE BRUSH	t	f	2026-06-03 12:31:53.929363	2026-06-03 12:31:53.929372	46	\N	CIV0036
1001	3	3	MAT-00073	4 Inch Refill	51	13	5	40	83	1182.14	\N	Covered	\N	18	Consumable	4 Inch Refill	t	f	2026-06-03 12:31:53.931405	2026-06-03 12:31:53.931415	46	\N	CIV0037
1002	3	3	MAT-00074	4" BRUSH	51	13	5	302	994	568.22	\N	Covered	\N	18	Consumable	4" BRUSH	t	f	2026-06-03 12:31:53.933404	2026-06-03 12:31:53.933413	46	\N	CIV0038
1003	3	3	MAT-00075	4" COTTON ROLL	51	13	5	14	29	1390.48	\N	Covered	\N	18	Consumable	4" COTTON ROLL	t	f	2026-06-03 12:31:53.935341	2026-06-03 12:31:53.93535	46	\N	CIV0039
1004	3	3	MAT-00076	4" Cotton Roller Set	51	13	5	10	30	1131.57	\N	Covered	\N	18	Consumable	4" Cotton Roller Set	t	f	2026-06-03 12:31:53.937712	2026-06-03 12:31:53.937722	46	\N	CIV0040
1005	3	3	MAT-00077	4" GRADING DC WHEEL	51	13	5	18	65	1150.53	\N	Covered	\N	18	Consumable	4" GRADING DC WHEEL	t	f	2026-06-03 12:31:53.939833	2026-06-03 12:31:53.939842	46	\N	CIV0041
1006	3	3	MAT-00078	4" Roller Refil	51	13	5	18	67	1338.79	\N	Covered	\N	18	Consumable	4" Roller Refil	t	f	2026-06-03 12:31:53.941718	2026-06-03 12:31:53.941727	46	\N	CIV0042
1007	3	3	MAT-00079	4115-AB11 APEX 1 Ltr	51	13	21	28	65	4459.72	\N	Covered	\N	18	Consumable	4115-AB11 APEX 1 Ltr	t	f	2026-06-03 12:31:53.943743	2026-06-03 12:31:53.943753	46	\N	CIV0043
1008	3	3	MAT-00080	4202-BW1 PE 20 Ltr	51	13	21	27	98	3288.75	\N	Covered	\N	18	Consumable	4202-BW1 PE 20 Ltr	t	f	2026-06-03 12:31:53.945768	2026-06-03 12:31:53.945777	46	\N	CIV0044
1009	3	3	MAT-00081	4202-SE2 SATIN 20 LTR	51	13	21	23	47	2503.69	\N	Covered	\N	18	Consumable	4202-SE2 SATIN 20 LTR	t	f	2026-06-03 12:31:53.947869	2026-06-03 12:31:53.947879	46	\N	CIV0045
1010	3	3	MAT-00082	4M PVC BOX	51	13	5	12	48	1277.49	\N	Covered	\N	18	Consumable	4M PVC BOX	t	f	2026-06-03 12:31:53.949869	2026-06-03 12:31:53.949878	46	\N	CIV0046
1011	3	3	MAT-00083	5.5 TR OUT DOOR COIL	51	13	5	153	530	669.48	\N	Covered	\N	18	Consumable	5.5 TR OUT DOOR COIL	t	f	2026-06-03 12:31:53.951776	2026-06-03 12:31:53.951785	46	\N	CIV0047
1012	3	3	MAT-00084	50x40 R BUSH	51	13	5	35	103	1367.03	\N	Covered	\N	18	Consumable	50x40 R BUSH	t	f	2026-06-03 12:31:53.954199	2026-06-03 12:31:53.954209	46	\N	CIV0048
1013	3	3	MAT-00085	6 MODULE PLATE MODULAR	51	13	5	31	77	1230.22	\N	Covered	\N	18	Consumable	6 MODULE PLATE MODULAR	t	f	2026-06-03 12:31:53.956283	2026-06-03 12:31:53.956291	46	\N	CIV0050
1014	3	3	MAT-00086	6" COTTON  ROLLER SET	51	13	5	17	43	1093.84	\N	Covered	\N	18	Consumable	6" COTTON  ROLLER SET	t	f	2026-06-03 12:31:53.958157	2026-06-03 12:31:53.958165	46	\N	CIV0051
1015	3	3	MAT-00087	6" COTTON ROLL	51	13	5	491	1899	781.96	\N	Covered	\N	18	Consumable	6" COTTON ROLL	t	f	2026-06-03 12:31:53.960032	2026-06-03 12:31:53.960042	46	\N	CIV0052
1016	3	3	MAT-00088	6" Cotton Roller Set	51	13	5	78	169	968.23	\N	Covered	\N	18	Consumable	6" Cotton Roller Set	t	f	2026-06-03 12:31:53.962106	2026-06-03 12:31:53.962114	46	\N	CIV0053
1017	3	3	MAT-00089	6" ROLLAR RIFFIL	51	13	5	34	113	1206.9	\N	Covered	\N	18	Consumable	6" ROLLAR RIFFIL	t	f	2026-06-03 12:31:53.964008	2026-06-03 12:31:53.964018	46	\N	CIV0054
1018	3	3	MAT-00090	6" Roller Refil	51	13	5	479	1016	747.1	\N	Covered	\N	18	Consumable	6" Roller Refil	t	f	2026-06-03 12:31:53.965941	2026-06-03 12:31:53.965949	46	\N	CIV0055
1019	3	3	MAT-00091	8 JK REGULAR PLIER	51	13	5	47	149	1136.37	\N	Covered	\N	18	Consumable	8 JK REGULAR PLIER	t	f	2026-06-03 12:31:53.967834	2026-06-03 12:31:53.967842	46	\N	CIV0056
1020	3	3	MAT-00092	8 MODULE PLATE MODULAR	51	13	5	45	141	1213.06	\N	Covered	\N	18	Consumable	8 MODULE PLATE MODULAR	t	f	2026-06-03 12:31:53.969975	2026-06-03 12:31:53.969985	46	\N	CIV0057
1021	3	3	MAT-00093	8" PUTTY BLADE	51	13	5	14	56	1000.61	\N	Covered	\N	18	Consumable	8" PUTTY BLADE	t	f	2026-06-03 12:31:53.97212	2026-06-03 12:31:53.972129	46	\N	CIV0058
1022	3	3	MAT-00094	8251 AB2 APEX 1Ltr	51	13	21	14	49	2138.73	\N	Covered	\N	18	Consumable	8251 AB2 APEX 1Ltr	t	f	2026-06-03 12:31:53.974099	2026-06-03 12:31:53.974108	46	\N	CIV0059
1023	3	3	MAT-00095	8251 AB2 APEX 20LTR	51	13	21	14	51	3889.37	\N	Covered	\N	18	Consumable	8251 AB2 APEX 20LTR	t	f	2026-06-03 12:31:53.976008	2026-06-03 12:31:53.976017	46	\N	CIV0060
1024	3	3	MAT-00096	8255-AB11 APEX 10 Ltr	51	13	21	38	96	2243.21	\N	Covered	\N	18	Consumable	8255-AB11 APEX 10 Ltr	t	f	2026-06-03 12:31:53.97811	2026-06-03 12:31:53.978119	46	\N	CIV0061
1025	3	3	MAT-00097	8255-AC9G ACE 1 Ltr	51	13	21	45	128	3878.78	\N	Covered	\N	18	Consumable	8255-AC9G ACE 1 Ltr	t	f	2026-06-03 12:31:53.979966	2026-06-03 12:31:53.979975	46	\N	CIV0062
1026	3	3	MAT-00098	8287-EB10 PEG 1Ltr	51	13	21	29	62	1755.49	\N	Covered	\N	18	Consumable	8287-EB10 PEG 1Ltr	t	f	2026-06-03 12:31:53.982211	2026-06-03 12:31:53.982219	46	\N	CIV0063
1027	3	3	MAT-00099	8308 TE3 TE 20LTR	51	13	21	18	38	3179.82	\N	Covered	\N	18	Consumable	8308 TE3 TE 20LTR	t	f	2026-06-03 12:31:53.984084	2026-06-03 12:31:53.984093	46	\N	CIV0064
1028	3	3	MAT-00100	8603 SE2 SATIN 4LTR	51	13	21	41	89	1926.19	\N	Covered	\N	18	Consumable	8603 SE2 SATIN 4LTR	t	f	2026-06-03 12:31:53.986171	2026-06-03 12:31:53.986181	46	\N	CIV0065
1029	3	3	MAT-00101	8603-AB2 APEX 1Ltr	51	13	21	13	32	2592.64	\N	Covered	\N	18	Consumable	8603-AB2 APEX 1Ltr	t	f	2026-06-03 12:31:53.988443	2026-06-03 12:31:53.988452	46	\N	CIV0066
1030	3	3	MAT-00102	8603-AB2 APEX 20 Ltr	51	13	21	31	69	2490.34	\N	Covered	\N	18	Consumable	8603-AB2 APEX 20 Ltr	t	f	2026-06-03 12:31:53.99041	2026-06-03 12:31:53.990418	46	\N	CIV0067
1031	3	3	MAT-00103	9" Exterior Roller	51	13	5	254	693	940.78	\N	Covered	\N	18	Consumable	9" Exterior Roller	t	f	2026-06-03 12:31:53.992282	2026-06-03 12:31:53.99229	46	\N	CIV0068
1032	3	3	MAT-00104	9" Interior Roller	51	13	5	45	145	1084.11	\N	Covered	\N	18	Consumable	9" Interior Roller	t	f	2026-06-03 12:31:53.994365	2026-06-03 12:31:53.994375	46	\N	CIV0069
1033	3	3	MAT-00105	9" ROLLAR  YELLOW / BLUE	51	13	5	230	907	649.5	\N	Covered	\N	18	Consumable	9" ROLLAR  YELLOW / BLUE	t	f	2026-06-03 12:31:53.996364	2026-06-03 12:31:53.996373	46	\N	CIV0070
1034	3	3	MAT-00106	AB2 APEX 1 LTR	51	13	21	32	67	3909.66	\N	Covered	\N	18	Consumable	AB2 APEX 1 LTR	t	f	2026-06-03 12:31:53.998443	2026-06-03 12:31:53.998452	46	\N	CIV0072
1035	3	3	MAT-00107	AB2 APEX 20 LTR	51	13	21	43	166	4407.21	\N	Covered	\N	18	Consumable	AB2 APEX 20 LTR	t	f	2026-06-03 12:31:54.000405	2026-06-03 12:31:54.000414	46	\N	CIV0073
1036	3	3	MAT-00108	Abro Paper Tape 1" 40mtr	51	13	5	19	47	1229.05	\N	Covered	\N	18	Consumable	Abro Paper Tape 1" 40mtr	t	f	2026-06-03 12:31:54.002479	2026-06-03 12:31:54.002489	46	\N	CIV0074
1037	3	3	MAT-00109	Adh Roff Cement 30 KG	51	13	1	442	1092	649.52	\N	Covered	\N	28.000000000000004	Consumable	Adh Roff Cement 30 KG	t	f	2026-06-03 12:31:54.004743	2026-06-03 12:31:54.004752	46	\N	CIV0075
1038	3	3	MAT-00110	ALUMINIUM ALUMINIUM PAINT 1 LTR	51	13	21	12	41	2427.63	\N	Covered	\N	18	Consumable	ALUMINIUM ALUMINIUM PAINT 1 LTR	t	f	2026-06-03 12:31:54.006781	2026-06-03 12:31:54.00679	46	\N	CIV0076
1039	3	3	MAT-00111	PATTY BLADES	51	13	5	434	912	557.14	\N	Covered	\N	18	Consumable	PATTY BLADES	t	f	2026-06-03 12:31:54.008684	2026-06-03 12:31:54.008692	46	\N	CIV0077
1040	3	3	MAT-00112	DIGITAL CLAMP METER (MODEL 1000 A AC)	52	14	5	50	174	3210.26	\N	Covered	\N	18	Non-Consumable	DIGITAL CLAMP METER (MODEL 1000 A AC)	t	f	2026-06-03 12:31:54.010656	2026-06-03 12:31:54.010666	59	\N	ELE0001
1041	3	3	MAT-00113	DIGITAL EARTH TESTER WITH KIT (MODEL DET.WACO)	52	14	5	17	43	1303.19	\N	Covered	\N	18	Non-Consumable	DIGITAL EARTH TESTER WITH KIT (MODEL DET.WACO)	t	f	2026-06-03 12:31:54.012679	2026-06-03 12:31:54.012687	59	\N	ELE0002
1042	3	3	MAT-00114	LEAKAGE CURRENT TESTER (MODEL ALCT60A)	52	14	5	220	598	977.01	\N	Covered	\N	18	Non-Consumable	LEAKAGE CURRENT TESTER (MODEL ALCT60A)	t	f	2026-06-03 12:31:54.01463	2026-06-03 12:31:54.01464	59	\N	ELE0003
1309	3	3	MAT-00381	STENT 3.5X24MM	54	19	5	30	65	7022.44	\N	Covered	\N	12	Consumable	STENT 3.5X24MM	t	f	2026-06-03 12:31:54.565605	2026-06-03 12:31:54.565614	59	\N	HOS0182
1043	3	3	MAT-00115	MULTIMETER MODEL 13S (DIGITAL)	52	14	5	19	49	1747.22	\N	Covered	\N	18	Non-Consumable	MULTIMETER MODEL 13S (DIGITAL)	t	f	2026-06-03 12:31:54.016635	2026-06-03 12:31:54.016643	59	\N	ELE0004
1044	3	3	MAT-00116	2M Plate Legrand	52	14	5	30	66	1873.84	\N	Covered	\N	18	Consumable	2M Plate Legrand	t	f	2026-06-03 12:31:54.018551	2026-06-03 12:31:54.01856	59	\N	ELE0005
1045	3	3	MAT-00117	3M Plate Legrand	52	14	5	10	26	2084.87	\N	Covered	\N	18	Consumable	3M Plate Legrand	t	f	2026-06-03 12:31:54.020775	2026-06-03 12:31:54.020784	59	\N	ELE0006
1046	3	3	MAT-00118	4M Plate Legrand	52	14	5	467	1356	796.41	\N	Covered	\N	18	Consumable	4M Plate Legrand	t	f	2026-06-03 12:31:54.022818	2026-06-03 12:31:54.022827	59	\N	ELE0007
1047	3	3	MAT-00119	6M Plate Legrand	52	14	5	30	103	2373.52	\N	Covered	\N	18	Consumable	6M Plate Legrand	t	f	2026-06-03 12:31:54.02479	2026-06-03 12:31:54.024798	59	\N	ELE0008
1048	3	3	MAT-00120	8M Plate Legrand (white)	52	14	5	302	1073	441.95	\N	Covered	\N	18	Consumable	8M Plate Legrand (white)	t	f	2026-06-03 12:31:54.02678	2026-06-03 12:31:54.02679	59	\N	ELE0009
1049	3	3	MAT-00121	8M Plate Legrand (Charcoalgrey)	52	14	5	20	76	2368.28	\N	Covered	\N	18	Consumable	8M Plate Legrand (Charcoalgrey)	t	f	2026-06-03 12:31:54.028861	2026-06-03 12:31:54.02887	59	\N	ELE0010
1050	3	3	MAT-00122	12M Plate Legrand	52	14	5	21	60	3569.11	\N	Covered	\N	18	Consumable	12M Plate Legrand	t	f	2026-06-03 12:31:54.03073	2026-06-03 12:31:54.030738	59	\N	ELE0011
1051	3	3	MAT-00123	16M Plate Legrand	52	14	5	44	150	1434.91	\N	Covered	\N	18	Consumable	16M Plate Legrand	t	f	2026-06-03 12:31:54.032757	2026-06-03 12:31:54.032766	59	\N	ELE0012
1052	3	3	MAT-00124	Footing Light Legrand	52	14	5	37	75	1115.57	\N	Covered	\N	18	Consumable	Footing Light Legrand	t	f	2026-06-03 12:31:54.034715	2026-06-03 12:31:54.034723	59	\N	ELE0013
1053	3	3	MAT-00125	32A DP Switch Legrand	52	14	5	50	192	3255.11	\N	Covered	\N	18	Consumable	32A DP Switch Legrand	t	f	2026-06-03 12:31:54.037787	2026-06-03 12:31:54.0378	59	\N	ELE0014
1054	3	3	MAT-00126	6A Switch Legrand	52	14	5	48	115	1979.52	\N	Covered	\N	18	Consumable	6A Switch Legrand	t	f	2026-06-03 12:31:54.040121	2026-06-03 12:31:54.04013	59	\N	ELE0015
1055	3	3	MAT-00127	6A Socket Legrand	52	14	5	37	123	4151.82	\N	Covered	\N	18	Consumable	6A Socket Legrand	t	f	2026-06-03 12:31:54.042062	2026-06-03 12:31:54.04207	59	\N	ELE0016
1056	3	3	MAT-00128	Dummy Plate  Legrand	52	14	5	21	69	4788.76	\N	Covered	\N	18	Consumable	Dummy Plate  Legrand	t	f	2026-06-03 12:31:54.044046	2026-06-03 12:31:54.044056	59	\N	ELE0017
1057	3	3	MAT-00129	16A Socket  Legrand	52	14	5	43	124	4328.04	\N	Covered	\N	18	Consumable	16A Socket  Legrand	t	f	2026-06-03 12:31:54.046032	2026-06-03 12:31:54.04604	59	\N	ELE0018
1058	3	3	MAT-00130	16A Switch with indicator  Legrand	52	14	5	84	208	171.24	\N	Covered	\N	18	Consumable	16A Switch with indicator  Legrand	t	f	2026-06-03 12:31:54.047952	2026-06-03 12:31:54.047961	59	\N	ELE0019
1059	3	3	MAT-00131	6A Plug Top	52	14	5	18	68	1425.5	\N	Covered	\N	18	Consumable	6A Plug Top	t	f	2026-06-03 12:31:54.050008	2026-06-03 12:31:54.050016	59	\N	ELE0020
1060	3	3	MAT-00132	Cable Tie 300mm	52	14	22	26	61	2870.54	\N	Covered	\N	18	Consumable	Cable Tie 300mm	t	f	2026-06-03 12:31:54.051976	2026-06-03 12:31:54.051985	59	\N	ELE0021
1061	3	3	MAT-00133	Cable Tie 200mm	52	14	22	26	54	3141.65	\N	Covered	\N	18	Consumable	Cable Tie 200mm	t	f	2026-06-03 12:31:54.054274	2026-06-03 12:31:54.054284	59	\N	ELE0022
1062	3	3	MAT-00134	10A Switch A/R	52	14	5	30	115	4657.57	\N	Covered	\N	18	Consumable	10A Switch A/R	t	f	2026-06-03 12:31:54.0564	2026-06-03 12:31:54.056408	59	\N	ELE0023
1063	3	3	MAT-00135	6A Switch A/R	52	14	5	39	135	3711.96	\N	Covered	\N	18	Consumable	6A Switch A/R	t	f	2026-06-03 12:31:54.058311	2026-06-03 12:31:54.058319	59	\N	ELE0024
1064	3	3	MAT-00136	16A Switch with indicator  A/R	52	14	5	146	474	292.91	\N	Covered	\N	18	Consumable	16A Switch with indicator  A/R	t	f	2026-06-03 12:31:54.060261	2026-06-03 12:31:54.060271	59	\N	ELE0025
1065	3	3	MAT-00137	16A Socket A/R	52	14	5	50	133	4930.95	\N	Covered	\N	18	Consumable	16A Socket A/R	t	f	2026-06-03 12:31:54.062307	2026-06-03 12:31:54.062315	59	\N	ELE0026
1066	3	3	MAT-00138	2M Fan Regulator A/R	52	14	5	42	167	2451.04	\N	Covered	\N	18	Consumable	2M Fan Regulator A/R	t	f	2026-06-03 12:31:54.064198	2026-06-03 12:31:54.064206	59	\N	ELE0027
1067	3	3	MAT-00139	6M Surface Box with Plate A/R	52	14	5	98	252	175.24	\N	Covered	\N	18	Consumable	6M Surface Box with Plate A/R	t	f	2026-06-03 12:31:54.06617	2026-06-03 12:31:54.06618	59	\N	ELE0028
1068	3	3	MAT-00140	8M Surface Box with Plate A/R	52	14	5	34	128	2227.48	\N	Covered	\N	18	Consumable	8M Surface Box with Plate A/R	t	f	2026-06-03 12:31:54.068058	2026-06-03 12:31:54.068066	59	\N	ELE0029
1069	3	3	MAT-00141	12M Surface Box with Plate A/R	52	14	5	33	87	3788.93	\N	Covered	\N	18	Consumable	12M Surface Box with Plate A/R	t	f	2026-06-03 12:31:54.070171	2026-06-03 12:31:54.070182	59	\N	ELE0030
1070	3	3	MAT-00142	1" PVC Bend VIP (Black)	52	14	5	13	31	3952.85	\N	Covered	\N	18	Consumable	1" PVC Bend VIP (Black)	t	f	2026-06-03 12:31:54.07235	2026-06-03 12:31:54.072358	59	\N	ELE0031
1071	3	3	MAT-00143	1M Plate PVC A/R	52	14	5	32	74	2183.22	\N	Covered	\N	18	Consumable	1M Plate PVC A/R	t	f	2026-06-03 12:31:54.074259	2026-06-03 12:31:54.074267	59	\N	ELE0032
1072	3	3	MAT-00144	2M Plate PVC A/R	52	14	5	12	45	4188.51	\N	Covered	\N	18	Consumable	2M Plate PVC A/R	t	f	2026-06-03 12:31:54.076107	2026-06-03 12:31:54.076115	59	\N	ELE0033
1073	3	3	MAT-00145	3M Plate PVC A/R	52	14	5	20	49	4605.63	\N	Covered	\N	18	Consumable	3M Plate PVC A/R	t	f	2026-06-03 12:31:54.078194	2026-06-03 12:31:54.078202	59	\N	ELE0034
1074	3	3	MAT-00146	4M Plate PVC A/R	52	14	5	35	94	4030.69	\N	Covered	\N	18	Consumable	4M Plate PVC A/R	t	f	2026-06-03 12:31:54.080012	2026-06-03 12:31:54.080021	59	\N	ELE0035
1075	3	3	MAT-00147	6M Plate PVC A/R	52	14	5	24	90	3641.78	\N	Covered	\N	18	Consumable	6M Plate PVC A/R	t	f	2026-06-03 12:31:54.0819	2026-06-03 12:31:54.081909	59	\N	ELE0036
1076	3	3	MAT-00148	8M Plate PVC A/R	52	14	5	15	42	3635.76	\N	Covered	\N	18	Consumable	8M Plate PVC A/R	t	f	2026-06-03 12:31:54.083932	2026-06-03 12:31:54.08394	59	\N	ELE0037
1077	3	3	MAT-00149	12M Plate PVC A/R	52	14	5	47	124	4429.23	\N	Covered	\N	18	Consumable	12M Plate PVC A/R	t	f	2026-06-03 12:31:54.08588	2026-06-03 12:31:54.085889	59	\N	ELE0038
1078	3	3	MAT-00150	8M Plate Legrand	52	14	5	45	180	4915.19	\N	Covered	\N	18	Consumable	8M Plate Legrand	t	f	2026-06-03 12:31:54.088211	2026-06-03 12:31:54.088221	59	\N	ELE0039
1079	3	3	MAT-00151	8M Metal Box	52	14	5	42	87	3804.98	\N	Covered	\N	18	Consumable	8M Metal Box	t	f	2026-06-03 12:31:54.090264	2026-06-03 12:31:54.090273	59	\N	ELE0040
1080	3	3	MAT-00152	1 1/4" Bend PVC	52	14	5	41	141	1100.38	\N	Covered	\N	18	Consumable	1 1/4" Bend PVC	t	f	2026-06-03 12:31:54.092121	2026-06-03 12:31:54.092129	59	\N	ELE0041
1081	3	3	MAT-00153	Fan Box (Red Colour)	52	14	5	31	122	3374.22	\N	Covered	\N	18	Consumable	Fan Box (Red Colour)	t	f	2026-06-03 12:31:54.094186	2026-06-03 12:31:54.094196	59	\N	ELE0042
1082	3	3	MAT-00154	2M Surface Box with Plate	52	14	5	35	135	4041.55	\N	Covered	\N	18	Consumable	2M Surface Box with Plate	t	f	2026-06-03 12:31:54.096295	2026-06-03 12:31:54.096303	59	\N	ELE0043
1083	3	3	MAT-00155	3/4" Junction Box PVC	52	14	5	19	52	3502.99	\N	Covered	\N	18	Consumable	3/4" Junction Box PVC	t	f	2026-06-03 12:31:54.098209	2026-06-03 12:31:54.098218	59	\N	ELE0044
1084	3	3	MAT-00156	1" Junction Box PVC	52	14	5	38	102	4720.27	\N	Covered	\N	18	Consumable	1" Junction Box PVC	t	f	2026-06-03 12:31:54.100252	2026-06-03 12:31:54.10026	59	\N	ELE0045
1085	3	3	MAT-00157	1 1/4" Junction box PVC	52	14	5	19	55	1251.65	\N	Covered	\N	18	Consumable	1 1/4" Junction box PVC	t	f	2026-06-03 12:31:54.102204	2026-06-03 12:31:54.102213	59	\N	ELE0046
1086	3	3	MAT-00158	4 Way Deep Junction Box	52	14	5	15	47	2880.27	\N	Covered	\N	18	Consumable	4 Way Deep Junction Box	t	f	2026-06-03 12:31:54.104395	2026-06-03 12:31:54.104406	59	\N	ELE0047
1087	3	3	MAT-00159	3 Way Deep Junction Box	52	14	5	44	140	3011.87	\N	Covered	\N	18	Consumable	3 Way Deep Junction Box	t	f	2026-06-03 12:31:54.106581	2026-06-03 12:31:54.10659	59	\N	ELE0048
1088	3	3	MAT-00160	1" Coller PVC	52	14	5	12	38	1507.94	\N	Covered	\N	18	Consumable	1" Coller PVC	t	f	2026-06-03 12:31:54.10849	2026-06-03 12:31:54.108499	59	\N	ELE0049
1089	3	3	MAT-00161	2" Bend PVC	52	14	5	25	87	3786.19	\N	Covered	\N	18	Consumable	2" Bend PVC	t	f	2026-06-03 12:31:54.110415	2026-06-03 12:31:54.110424	59	\N	ELE0050
1090	3	3	MAT-00162	2M Metal Box	52	14	5	47	145	1498.42	\N	Covered	\N	18	Consumable	2M Metal Box	t	f	2026-06-03 12:31:54.112501	2026-06-03 12:31:54.112509	59	\N	ELE0051
1091	3	3	MAT-00163	3M Metal Box	52	14	5	44	131	1380.96	\N	Covered	\N	18	Consumable	3M Metal Box	t	f	2026-06-03 12:31:54.114431	2026-06-03 12:31:54.11444	59	\N	ELE0052
1092	3	3	MAT-00164	4M Metal Box	52	14	5	50	183	1221.19	\N	Covered	\N	18	Consumable	4M Metal Box	t	f	2026-06-03 12:31:54.116443	2026-06-03 12:31:54.116452	59	\N	ELE0053
1093	3	3	MAT-00165	6M Metal Box	52	14	5	18	49	3301.66	\N	Covered	\N	18	Consumable	6M Metal Box	t	f	2026-06-03 12:31:54.118385	2026-06-03 12:31:54.118394	59	\N	ELE0054
1094	3	3	MAT-00166	8M Metal Box	52	14	5	16	41	4683.8	\N	Covered	\N	18	Consumable	8M Metal Box	t	f	2026-06-03 12:31:54.120543	2026-06-03 12:31:54.120554	59	\N	ELE0055
1095	3	3	MAT-00167	12M Metal Box	52	14	5	312	663	709.73	\N	Covered	\N	18	Consumable	12M Metal Box	t	f	2026-06-03 12:31:54.122621	2026-06-03 12:31:54.122714	59	\N	ELE0056
1096	3	3	MAT-00168	16M Metal Box	52	14	5	21	60	1698.06	\N	Covered	\N	18	Consumable	16M Metal Box	t	f	2026-06-03 12:31:54.12463	2026-06-03 12:31:54.124638	59	\N	ELE0057
1097	3	3	MAT-00169	1" Baseb Sadle	52	14	5	29	78	4403.35	\N	Covered	\N	18	Consumable	1" Baseb Sadle	t	f	2026-06-03 12:31:54.126531	2026-06-03 12:31:54.126539	59	\N	ELE0058
1098	3	3	MAT-00170	1 1/4" Base Sadle	52	14	5	477	979	301.97	\N	Covered	\N	18	Consumable	1 1/4" Base Sadle	t	f	2026-06-03 12:31:54.128619	2026-06-03 12:31:54.128628	59	\N	ELE0059
1099	3	3	MAT-00171	1 1/4" Flex Pipe	52	14	11	42	99	3782.04	\N	Covered	\N	18	Consumable	1 1/4" Flex Pipe	t	f	2026-06-03 12:31:54.13043	2026-06-03 12:31:54.130439	59	\N	ELE0060
1100	3	3	MAT-00172	1" Flex Pipe	52	14	11	279	930	719.11	\N	Covered	\N	18	Consumable	1" Flex Pipe	t	f	2026-06-03 12:31:54.132399	2026-06-03 12:31:54.132408	59	\N	ELE0061
1101	3	3	MAT-00173	3/4" Flex Pipe	52	14	11	35	126	4667.24	\N	Covered	\N	18	Consumable	3/4" Flex Pipe	t	f	2026-06-03 12:31:54.134463	2026-06-03 12:31:54.134472	59	\N	ELE0062
1102	3	3	MAT-00174	Chakka Plate	52	14	5	256	671	911.82	\N	Covered	\N	18	Consumable	Chakka Plate	t	f	2026-06-03 12:31:54.13656	2026-06-03 12:31:54.136571	59	\N	ELE0063
1103	3	3	MAT-00175	Ceiling Fan Crompton 1200mm	52	14	5	46	95	1271.16	\N	Covered	\N	18	Non-Consumable	Ceiling Fan Crompton 1200mm	t	f	2026-06-03 12:31:54.138813	2026-06-03 12:31:54.138823	59	\N	ELE0064
1104	3	3	MAT-00176	63A MCB 4P	52	14	5	49	172	4869.23	\N	Covered	\N	18	Consumable	63A MCB 4P	t	f	2026-06-03 12:31:54.140842	2026-06-03 12:31:54.140851	59	\N	ELE0065
1105	3	3	MAT-00177	63A MCB 2P	52	14	5	26	103	2811.44	\N	Covered	\N	18	Consumable	63A MCB 2P	t	f	2026-06-03 12:31:54.14275	2026-06-03 12:31:54.142759	59	\N	ELE0066
1106	3	3	MAT-00178	63A MCB 1P	52	14	5	35	76	4215.6	\N	Covered	\N	18	Consumable	63A MCB 1P	t	f	2026-06-03 12:31:54.144977	2026-06-03 12:31:54.144988	59	\N	ELE0067
1107	3	3	MAT-00179	16A MCB 2P	52	14	5	39	85	3018.82	\N	Covered	\N	18	Consumable	16A MCB 2P	t	f	2026-06-03 12:31:54.147157	2026-06-03 12:31:54.147166	59	\N	ELE0068
1108	3	3	MAT-00180	16A MCB 1P	52	14	5	34	79	2336.93	\N	Covered	\N	18	Consumable	16A MCB 1P	t	f	2026-06-03 12:31:54.149488	2026-06-03 12:31:54.149499	59	\N	ELE0069
1109	3	3	MAT-00181	20A MCB 1P	52	14	5	45	110	4572.64	\N	Covered	\N	18	Consumable	20A MCB 1P	t	f	2026-06-03 12:31:54.151699	2026-06-03 12:31:54.151708	59	\N	ELE0070
1110	3	3	MAT-00182	40A MCB 1P	52	14	5	46	108	3639.96	\N	Covered	\N	18	Consumable	40A MCB 1P	t	f	2026-06-03 12:31:54.154022	2026-06-03 12:31:54.154034	59	\N	ELE0071
1111	3	3	MAT-00183	28M Gland	52	14	5	49	159	2923.87	\N	Covered	\N	18	Consumable	28M Gland	t	f	2026-06-03 12:31:54.15619	2026-06-03 12:31:54.156199	59	\N	ELE0072
1112	3	3	MAT-00184	2M MCB waterproof Box	52	14	5	66	157	869.91	\N	Covered	\N	18	Consumable	2M MCB waterproof Box	t	f	2026-06-03 12:31:54.158113	2026-06-03 12:31:54.158121	59	\N	ELE0073
1113	3	3	MAT-00185	4M MCB waterproof Box	52	14	5	16	38	1396.74	\N	Covered	\N	18	Consumable	4M MCB waterproof Box	t	f	2026-06-03 12:31:54.160028	2026-06-03 12:31:54.160037	59	\N	ELE0074
1114	3	3	MAT-00186	POP Screw 3.5x38	52	14	14	42	86	1195.3	\N	Covered	\N	18	Consumable	POP Screw 3.5x38	t	f	2026-06-03 12:31:54.162225	2026-06-03 12:31:54.162236	59	\N	ELE0075
1115	3	3	MAT-00187	POP Screw 3.5x25	52	14	14	41	86	3055.26	\N	Covered	\N	18	Consumable	POP Screw 3.5x25	t	f	2026-06-03 12:31:54.164285	2026-06-03 12:31:54.164294	59	\N	ELE0076
1116	3	3	MAT-00188	Dry wall Screw 3.5x50	52	14	14	27	85	1080.95	\N	Covered	\N	18	Consumable	Dry wall Screw 3.5x50	t	f	2026-06-03 12:31:54.16636	2026-06-03 12:31:54.16637	59	\N	ELE0077
1117	3	3	MAT-00189	Dry wall Screw 25x6	52	14	14	17	55	2566.45	\N	Covered	\N	18	Consumable	Dry wall Screw 25x6	t	f	2026-06-03 12:31:54.168391	2026-06-03 12:31:54.1684	59	\N	ELE0078
1118	3	3	MAT-00190	2" Concrete Steel Nail	52	14	6	10	39	3710.98	\N	Covered	\N	18	Consumable	2" Concrete Steel Nail	t	f	2026-06-03 12:31:54.170563	2026-06-03 12:31:54.170574	59	\N	ELE0079
1119	3	3	MAT-00191	40mm Fisher	52	14	22	376	1145	826.12	\N	Covered	\N	18	Consumable	40mm Fisher	t	f	2026-06-03 12:31:54.172821	2026-06-03 12:31:54.17283	59	\N	ELE0080
1120	3	3	MAT-00192	4" Cutt off Wheel	52	14	5	10	34	1419.92	\N	Covered	\N	18	Consumable	4" Cutt off Wheel	t	f	2026-06-03 12:31:54.174787	2026-06-03 12:31:54.174795	59	\N	ELE0081
1121	3	3	MAT-00193	Bulk Head LED light	52	14	5	369	952	612.75	\N	Covered	\N	18	Consumable	Bulk Head LED light	t	f	2026-06-03 12:31:54.176707	2026-06-03 12:31:54.176716	59	\N	ELE0082
1122	3	3	MAT-00194	Strip light (Luker)	52	14	5	31	118	3732.83	\N	Covered	\N	18	Consumable	Strip light (Luker)	t	f	2026-06-03 12:31:54.178849	2026-06-03 12:31:54.178858	59	\N	ELE0083
1123	3	3	MAT-00195	Double Door MCB Box	52	14	5	84	288	60.8	\N	Covered	\N	18	Consumable	Double Door MCB Box	t	f	2026-06-03 12:31:54.180832	2026-06-03 12:31:54.18084	59	\N	ELE0084
1310	3	3	MAT-00382	STENT 3.5X28MM	54	19	5	3	7	36814.54	\N	Covered	\N	12	Consumable	STENT 3.5X28MM	t	f	2026-06-03 12:31:54.567719	2026-06-03 12:31:54.567729	59	\N	HOS0183
1124	3	3	MAT-00196	LED Strip outdoor connector	52	14	5	39	142	3395	\N	Covered	\N	18	Consumable	LED Strip outdoor connector	t	f	2026-06-03 12:31:54.182948	2026-06-03 12:31:54.182958	59	\N	ELE0085
1125	3	3	MAT-00197	Cat 6 Cable	52	14	5	59	194	353.27	\N	Covered	\N	18	Consumable	Cat 6 Cable	t	f	2026-06-03 12:31:54.185013	2026-06-03 12:31:54.185022	59	\N	ELE0086
1126	3	3	MAT-00198	2" LED Battern	52	14	5	35	130	1208.02	\N	Covered	\N	18	Consumable	2" LED Battern	t	f	2026-06-03 12:31:54.187156	2026-06-03 12:31:54.187167	59	\N	ELE0087
1127	3	3	MAT-00199	4" LED Battern	52	14	5	231	533	96.14	\N	Covered	\N	18	Consumable	4" LED Battern	t	f	2026-06-03 12:31:54.189703	2026-06-03 12:31:54.189715	59	\N	ELE0088
1128	3	3	MAT-00200	PHARMACY CLOTH COVERS - 13X16	54	29	6	4	16	25218.56	\N	Covered	\N	5	Consumable	PHARMACY CLOTH COVERS - 13X16	t	f	2026-06-03 12:31:54.191811	2026-06-03 12:31:54.191819	59	\N	HOS0001
1129	3	3	MAT-00201	PHARMACY CLOTH COVERS - 16X20	54	29	6	13	44	9699.42	\N	Covered	\N	5	Consumable	PHARMACY CLOTH COVERS - 16X20	t	f	2026-06-03 12:31:54.193695	2026-06-03 12:31:54.193703	59	\N	HOS0002
1130	3	3	MAT-00202	PHARMACY CLOTH COVERS - 9X13	54	29	6	4	14	47777.02	\N	Covered	\N	5	Consumable	PHARMACY CLOTH COVERS - 9X13	t	f	2026-06-03 12:31:54.195578	2026-06-03 12:31:54.195587	59	\N	HOS0003
1131	3	3	MAT-00203	STETHOSCOPE MICROTOME	54	26	5	5	14	15728.29	\N	Covered	\N	12	Non-Consumable	STETHOSCOPE MICROTOME	t	f	2026-06-03 12:31:54.197482	2026-06-03 12:31:54.19749	59	\N	HOS0004
1132	3	3	MAT-00204	CLENZYME (MULTIENZYME CLEANER)1000ML.	54	26	5	5	11	20144.9	\N	Covered	\N	18	Consumable	CLENZYME (MULTIENZYME CLEANER)1000ML.	t	f	2026-06-03 12:31:54.199386	2026-06-03 12:31:54.199396	59	\N	HOS0005
1133	3	3	MAT-00205	BUCKET PLASTIC 20Ltrs	54	26	5	5	18	32845.83	\N	Covered	\N	18	Non-Consumable	BUCKET PLASTIC 20Ltrs	t	f	2026-06-03 12:31:54.201418	2026-06-03 12:31:54.201427	59	\N	HOS0006
1134	3	3	MAT-00206	KIRAN COAT APRON 0.5MM PB 100CM X 60CM	54	28	5	5	17	10818.26	\N	Covered	\N	12	Consumable	KIRAN COAT APRON 0.5MM PB 100CM X 60CM	t	f	2026-06-03 12:31:54.203464	2026-06-03 12:31:54.203475	59	\N	HOS0007
1135	3	3	MAT-00207	BAYER 190ML HIGH PRESSURE INJECTOR SYRINGE	54	30	5	4	12	39682.9	\N	Covered	\N	12	Consumable	BAYER 190ML HIGH PRESSURE INJECTOR SYRINGE	t	f	2026-06-03 12:31:54.20589	2026-06-03 12:31:54.205902	59	\N	HOS0008
1136	3	3	MAT-00208	BED PAN STEEL	54	26	5	5	16	30531.96	\N	Covered	\N	18	Non-Consumable	BED PAN STEEL	t	f	2026-06-03 12:31:54.207988	2026-06-03 12:31:54.207997	59	\N	HOS0009
1137	3	3	MAT-00209	BED PAN PLASTIC	54	26	5	4	16	41874.87	\N	Covered	\N	18	Non-Consumable	BED PAN PLASTIC	t	f	2026-06-03 12:31:54.210232	2026-06-03 12:31:54.210241	59	\N	HOS0010
1138	3	3	MAT-00210	URINE CANE (MALE)	54	26	5	3	7	25531.88	\N	Covered	\N	12	Non-Consumable	URINE CANE (MALE)	t	f	2026-06-03 12:31:54.212151	2026-06-03 12:31:54.212159	59	\N	HOS0011
1139	3	3	MAT-00211	STEEL BUCKET 5 LTRS	54	26	5	4	14	30747	\N	Covered	\N	18	Non-Consumable	STEEL BUCKET 5 LTRS	t	f	2026-06-03 12:31:54.214065	2026-06-03 12:31:54.214073	59	\N	HOS0012
1140	3	3	MAT-00212	DRESSING BIN 6 X 6 SS	54	26	5	5	17	11616.55	\N	Covered	\N	18	Non-Consumable	DRESSING BIN 6 X 6 SS	t	f	2026-06-03 12:31:54.216142	2026-06-03 12:31:54.216151	59	\N	HOS0013
1141	3	3	MAT-00213	TRAY WITH COVER 10 X8	54	26	13	5	17	32278.21	\N	Covered	\N	18	Non-Consumable	TRAY WITH COVER 10 X8	t	f	2026-06-03 12:31:54.218194	2026-06-03 12:31:54.218203	59	\N	HOS0014
1142	3	3	MAT-00214	TRAY WITH COVER 12 X 10	54	26	13	3	10	13739.84	\N	Covered	\N	18	Non-Consumable	TRAY WITH COVER 12 X 10	t	f	2026-06-03 12:31:54.220342	2026-06-03 12:31:54.220353	59	\N	HOS0015
1143	3	3	MAT-00215	TRAY WITH COVER 9 X 6	54	26	13	2	8	16241.02	\N	Covered	\N	18	Non-Consumable	TRAY WITH COVER 9 X 6	t	f	2026-06-03 12:31:54.222862	2026-06-03 12:31:54.222873	59	\N	HOS0016
1144	3	3	MAT-00216	TRAY WITH COVER SS 12 X 10	54	26	13	4	13	46179.91	\N	Covered	\N	18	Non-Consumable	TRAY WITH COVER SS 12 X 10	t	f	2026-06-03 12:31:54.225351	2026-06-03 12:31:54.225362	59	\N	HOS0017
1145	3	3	MAT-00217	TRAY WITH COVER SS 18 X 12	54	26	13	5	17	28057.06	\N	Covered	\N	18	Non-Consumable	TRAY WITH COVER SS 18 X 12	t	f	2026-06-03 12:31:54.227462	2026-06-03 12:31:54.227471	59	\N	HOS0018
1146	3	3	MAT-00218	TRAY WITH COVER SS 8 X 3	54	26	13	3	11	42302.32	\N	Covered	\N	18	Non-Consumable	TRAY WITH COVER SS 8 X 3	t	f	2026-06-03 12:31:54.229687	2026-06-03 12:31:54.229698	59	\N	HOS0019
1147	3	3	MAT-00219	Mindray SpO2 Adult Probe	54	18	5	4	16	28396.63	\N	Covered	\N	12	Consumable	Mindray SpO2 Adult Probe	t	f	2026-06-03 12:31:54.231932	2026-06-03 12:31:54.231941	59	\N	HOS0020
1148	3	3	MAT-00220	Mindray SpO2 Pediatric Probe	54	18	5	3	9	14585.87	\N	Covered	\N	12	Consumable	Mindray SpO2 Pediatric Probe	t	f	2026-06-03 12:31:54.234223	2026-06-03 12:31:54.234233	59	\N	HOS0021
1149	3	3	MAT-00221	Mindray SpO2 Neonatal Probe	54	18	5	5	13	35708.56	\N	Covered	\N	12	Consumable	Mindray SpO2 Neonatal Probe	t	f	2026-06-03 12:31:54.236316	2026-06-03 12:31:54.236326	59	\N	HOS0022
1150	3	3	MAT-00222	Mindray ECG Cable	54	18	5	3	7	30824.89	\N	Covered	\N	12	Consumable	Mindray ECG Cable	t	f	2026-06-03 12:31:54.238725	2026-06-03 12:31:54.238736	59	\N	HOS0023
1151	3	3	MAT-00223	Mindray NIBP Hose	54	18	5	2	7	39929.38	\N	Covered	\N	12	Consumable	Mindray NIBP Hose	t	f	2026-06-03 12:31:54.24102	2026-06-03 12:31:54.24103	59	\N	HOS0024
1152	3	3	MAT-00224	Philips SpO2 Adult Probe	54	18	5	4	12	14907.95	\N	Covered	\N	12	Consumable	Philips SpO2 Adult Probe	t	f	2026-06-03 12:31:54.243362	2026-06-03 12:31:54.243372	59	\N	HOS0025
1153	3	3	MAT-00225	Philips SpO2 Pediatric Probe	54	18	5	43	146	7679.63	\N	Covered	\N	12	Consumable	Philips SpO2 Pediatric Probe	t	f	2026-06-03 12:31:54.245985	2026-06-03 12:31:54.245997	59	\N	HOS0026
1154	3	3	MAT-00226	Philips SpO2 Neonatal Probe	54	18	5	4	12	34011.43	\N	Covered	\N	12	Consumable	Philips SpO2 Neonatal Probe	t	f	2026-06-03 12:31:54.248016	2026-06-03 12:31:54.248025	59	\N	HOS0027
1155	3	3	MAT-00227	Philips ECG Cable	54	18	5	4	13	33761.49	\N	Covered	\N	12	Consumable	Philips ECG Cable	t	f	2026-06-03 12:31:54.250111	2026-06-03 12:31:54.25012	59	\N	HOS0028
1156	3	3	MAT-00228	Philips NIBP Hose	54	18	5	2	5	28663.04	\N	Covered	\N	12	Consumable	Philips NIBP Hose	t	f	2026-06-03 12:31:54.252151	2026-06-03 12:31:54.25216	59	\N	HOS0029
1157	3	3	MAT-00229	Comen SpO2 Adult Probe	54	18	5	4	14	27583.36	\N	Covered	\N	12	Consumable	Comen SpO2 Adult Probe	t	f	2026-06-03 12:31:54.254392	2026-06-03 12:31:54.254403	59	\N	HOS0030
1158	3	3	MAT-00230	Comen SpO2 Pediatric Probe	54	18	5	4	9	26109.32	\N	Covered	\N	12	Consumable	Comen SpO2 Pediatric Probe	t	f	2026-06-03 12:31:54.256748	2026-06-03 12:31:54.256757	59	\N	HOS0031
1159	3	3	MAT-00231	Comen SpO2 Neonatal Probe	54	18	5	5	12	40196.65	\N	Covered	\N	12	Consumable	Comen SpO2 Neonatal Probe	t	f	2026-06-03 12:31:54.258935	2026-06-03 12:31:54.258943	59	\N	HOS0032
1160	3	3	MAT-00232	Comen ECG Cable	54	18	5	2	5	22272.98	\N	Covered	\N	12	Consumable	Comen ECG Cable	t	f	2026-06-03 12:31:54.260896	2026-06-03 12:31:54.260905	59	\N	HOS0033
1161	3	3	MAT-00233	Comen NIBP Hose	54	18	5	2	7	30445.33	\N	Covered	\N	12	Consumable	Comen NIBP Hose	t	f	2026-06-03 12:31:54.262793	2026-06-03 12:31:54.262802	59	\N	HOS0034
1162	3	3	MAT-00234	Edan SpO2 Adult Probe	54	18	5	2	8	43429.35	\N	Covered	\N	12	Consumable	Edan SpO2 Adult Probe	t	f	2026-06-03 12:31:54.264665	2026-06-03 12:31:54.264674	59	\N	HOS0035
1163	3	3	MAT-00235	Edan SpO2 Pediatric Probe	54	18	5	2	7	11528.14	\N	Covered	\N	12	Consumable	Edan SpO2 Pediatric Probe	t	f	2026-06-03 12:31:54.267	2026-06-03 12:31:54.267013	59	\N	HOS0036
1164	3	3	MAT-00236	Edan SpO2 Neonatal Probe	54	18	5	3	11	42685.66	\N	Covered	\N	12	Consumable	Edan SpO2 Neonatal Probe	t	f	2026-06-03 12:31:54.269505	2026-06-03 12:31:54.269515	59	\N	HOS0037
1165	3	3	MAT-00237	Edan ECG Cable	54	18	5	4	16	15007.85	\N	Covered	\N	12	Consumable	Edan ECG Cable	t	f	2026-06-03 12:31:54.271911	2026-06-03 12:31:54.271924	59	\N	HOS0038
1166	3	3	MAT-00238	Edan NIBP Hose	54	18	5	3	11	46249.16	\N	Covered	\N	12	Consumable	Edan NIBP Hose	t	f	2026-06-03 12:31:54.274138	2026-06-03 12:31:54.274147	59	\N	HOS0039
1167	3	3	MAT-00239	GE SpO2 Adult Probe	54	18	5	4	13	49341.02	\N	Covered	\N	12	Consumable	GE SpO2 Adult Probe	t	f	2026-06-03 12:31:54.276103	2026-06-03 12:31:54.276111	59	\N	HOS0040
1168	3	3	MAT-00240	GE SpO2 Pediatric Probe	54	18	5	5	16	27138.7	\N	Covered	\N	12	Consumable	GE SpO2 Pediatric Probe	t	f	2026-06-03 12:31:54.278006	2026-06-03 12:31:54.278014	59	\N	HOS0041
1169	3	3	MAT-00241	GE SpO2 Neonatal Probe	54	18	5	2	6	21012.11	\N	Covered	\N	12	Consumable	GE SpO2 Neonatal Probe	t	f	2026-06-03 12:31:54.279917	2026-06-03 12:31:54.279926	59	\N	HOS0042
1170	3	3	MAT-00242	GE ECG Cable	54	18	5	4	12	30635.68	\N	Covered	\N	12	Consumable	GE ECG Cable	t	f	2026-06-03 12:31:54.281802	2026-06-03 12:31:54.281811	59	\N	HOS0043
1171	3	3	MAT-00243	GE NIBP Hose	54	18	5	4	16	18506.34	\N	Covered	\N	12	Consumable	GE NIBP Hose	t	f	2026-06-03 12:31:54.283818	2026-06-03 12:31:54.283826	59	\N	HOS0044
1172	3	3	MAT-00244	NIBP Cuff Adult	54	18	5	5	20	29779.06	\N	Covered	\N	12	Consumable	NIBP Cuff Adult	t	f	2026-06-03 12:31:54.285645	2026-06-03 12:31:54.285653	59	\N	HOS0045
1173	3	3	MAT-00245	NIBP Cuff Pediatric	54	18	5	3	8	21809.45	\N	Covered	\N	12	Consumable	NIBP Cuff Pediatric	t	f	2026-06-03 12:31:54.28788	2026-06-03 12:31:54.287892	59	\N	HOS0046
1174	3	3	MAT-00246	NIBP Cuff Neonatal	54	18	5	4	12	16813.02	\N	Covered	\N	12	Consumable	NIBP Cuff Neonatal	t	f	2026-06-03 12:31:54.290243	2026-06-03 12:31:54.290252	59	\N	HOS0047
1175	3	3	MAT-00247	BP Apparatus Bladder Adult	54	18	5	2	8	48701.77	\N	Covered	\N	12	Non-Consumable	BP Apparatus Bladder Adult	t	f	2026-06-03 12:31:54.292239	2026-06-03 12:31:54.292248	59	\N	HOS0048
1176	3	3	MAT-00248	BP Apparatus Bladder with Bag Pediatric	54	18	5	3	11	23041.66	\N	Covered	\N	12	Non-Consumable	BP Apparatus Bladder with Bag Pediatric	t	f	2026-06-03 12:31:54.29418	2026-06-03 12:31:54.294189	59	\N	HOS0049
1177	3	3	MAT-00249	BP Apparatus Bulb	54	18	5	2	7	48366.14	\N	Covered	\N	12	Consumable	BP Apparatus Bulb	t	f	2026-06-03 12:31:54.296027	2026-06-03 12:31:54.296035	59	\N	HOS0050
1178	3	3	MAT-00250	BP Apparatus Bag	54	18	5	4	14	16005.15	\N	Covered	\N	12	Non-Consumable	BP Apparatus Bag	t	f	2026-06-03 12:31:54.297873	2026-06-03 12:31:54.297882	59	\N	HOS0051
1179	3	3	MAT-00251	Digital BP Apparatus Cuff	54	18	5	5	12	33083.39	\N	Covered	\N	12	Non-Consumable	Digital BP Apparatus Cuff	t	f	2026-06-03 12:31:54.299905	2026-06-03 12:31:54.299916	59	\N	HOS0052
1180	3	3	MAT-00252	3-Pin Power Cord	54	18	5	3	12	24958.01	\N	Covered	\N	18	Consumable	3-Pin Power Cord	t	f	2026-06-03 12:31:54.302009	2026-06-03 12:31:54.302018	59	\N	HOS0053
1181	3	3	MAT-00253	ECG Machine Cable	54	18	5	4	15	33615.39	\N	Covered	\N	12	Consumable	ECG Machine Cable	t	f	2026-06-03 12:31:54.304169	2026-06-03 12:31:54.304181	59	\N	HOS0054
1182	3	3	MAT-00254	ECG Machine Clamp	54	18	5	5	15	11133.42	\N	Covered	\N	12	Consumable	ECG Machine Clamp	t	f	2026-06-03 12:31:54.306682	2026-06-03 12:31:54.306691	59	\N	HOS0055
1183	3	3	MAT-00255	ECG Machine Bulb	54	18	5	5	11	23753.77	\N	Covered	\N	12	Consumable	ECG Machine Bulb	t	f	2026-06-03 12:31:54.308605	2026-06-03 12:31:54.308614	59	\N	HOS0056
1184	3	3	MAT-00256	Ventilator Oxygen Sensor	54	18	5	2	7	43733.61	\N	Covered	\N	12	Non-Consumable	Ventilator Oxygen Sensor	t	f	2026-06-03 12:31:54.310538	2026-06-03 12:31:54.310547	59	\N	HOS0057
1185	3	3	MAT-00257	Ventilator Battery	54	18	5	2	8	40562.32	\N	Covered	\N	12	Consumable	Ventilator Battery	t	f	2026-06-03 12:31:54.312432	2026-06-03 12:31:54.31244	59	\N	HOS0058
1186	3	3	MAT-00258	Monitor Battery	54	18	5	2	5	39903.79	\N	Covered	\N	12	Consumable	Monitor Battery	t	f	2026-06-03 12:31:54.314336	2026-06-03 12:31:54.314344	59	\N	HOS0059
1187	3	3	MAT-00259	Syringe Pump Battery	54	18	5	4	16	33292.48	\N	Covered	\N	12	Consumable	Syringe Pump Battery	t	f	2026-06-03 12:31:54.31629	2026-06-03 12:31:54.316299	59	\N	HOS0060
1188	3	3	MAT-00260	Infusion Pump Battery	54	18	5	3	10	13782.48	\N	Covered	\N	12	Consumable	Infusion Pump Battery	t	f	2026-06-03 12:31:54.318273	2026-06-03 12:31:54.318281	59	\N	HOS0061
1189	3	3	MAT-00261	ECG Machine Battery	54	18	5	42	119	8739.31	\N	Covered	\N	12	Consumable	ECG Machine Battery	t	f	2026-06-03 12:31:54.320304	2026-06-03 12:31:54.320315	59	\N	HOS0062
1190	3	3	MAT-00262	X-Ray View Box 12V DC Adaptor	54	18	5	2	8	41675.63	\N	Covered	\N	18	Non-Consumable	X-Ray View Box 12V DC Adaptor	t	f	2026-06-03 12:31:54.322804	2026-06-03 12:31:54.322815	59	\N	HOS0063
1191	3	3	MAT-00263	0.032 X 150 TERUMO GUIDE WIRE	54	19	5	3	10	16526.16	\N	Covered	\N	12	Consumable	0.032 X 150 TERUMO GUIDE WIRE	t	f	2026-06-03 12:31:54.324911	2026-06-03 12:31:54.324919	59	\N	HOS0064
1192	3	3	MAT-00264	0.035X150CM TEFLON WIRE J.TIP	54	19	5	2	8	26703.28	\N	Covered	\N	12	Consumable	0.035X150CM TEFLON WIRE J.TIP	t	f	2026-06-03 12:31:54.326839	2026-06-03 12:31:54.326848	59	\N	HOS0065
1193	3	3	MAT-00265	ACCURA BMV BALLOON KIT WILL ALL ACCESSORIES	54	19	5	4	14	15813.16	\N	Covered	\N	12	Consumable	ACCURA BMV BALLOON KIT WILL ALL ACCESSORIES	t	f	2026-06-03 12:31:54.328699	2026-06-03 12:31:54.328707	59	\N	HOS0066
1194	3	3	MAT-00266	ANGI DAIG JR 3.5 6FR CORDIS	54	19	5	5	13	16732.04	\N	Covered	\N	12	Consumable	ANGI DAIG JR 3.5 6FR CORDIS	t	f	2026-06-03 12:31:54.330614	2026-06-03 12:31:54.330623	59	\N	HOS0067
1195	3	3	MAT-00267	APNEALINK CANNULA- 25 PACK	54	19	5	4	16	12432.24	\N	Covered	\N	12	Consumable	APNEALINK CANNULA- 25 PACK	t	f	2026-06-03 12:31:54.332513	2026-06-03 12:31:54.332521	59	\N	HOS0068
1196	3	3	MAT-00268	ASAHI GW GAIA THIRD	54	19	5	5	15	48367.03	\N	Covered	\N	12	Consumable	ASAHI GW GAIA THIRD	t	f	2026-06-03 12:31:54.334524	2026-06-03 12:31:54.334533	59	\N	HOS0069
1197	3	3	MAT-00269	BI-PHASIC DEFIBRILLATOR MODEL: RELIFE 900 - MAKE BPL	54	19	5	3	7	20706.22	\N	Covered	\N	12	Consumable	BI-PHASIC DEFIBRILLATOR MODEL: RELIFE 900 - MAKE BPL	t	f	2026-06-03 12:31:54.336495	2026-06-03 12:31:54.336503	59	\N	HOS0070
1198	3	3	MAT-00270	BL LIFESCIENCES . 1/2  X 3/32  10 FEET TUBING STERILE	54	19	5	40	107	8529.68	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 1/2  X 3/32  10 FEET TUBING STERILE	t	f	2026-06-03 12:31:54.338895	2026-06-03 12:31:54.338906	59	\N	HOS0071
1199	3	3	MAT-00271	BL LIFESCIENCES . 1/2 X 1/2 ST	54	19	5	3	8	14243.26	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 1/2 X 1/2 ST	t	f	2026-06-03 12:31:54.341151	2026-06-03 12:31:54.34116	59	\N	HOS0072
1200	3	3	MAT-00272	BL LIFESCIENCES . 1/4  X 3/32  10 FEET TUBING STERILE	54	19	5	2	8	26824.34	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 1/4  X 3/32  10 FEET TUBING STERILE	t	f	2026-06-03 12:31:54.343086	2026-06-03 12:31:54.343095	59	\N	HOS0073
1201	3	3	MAT-00273	BL LIFESCIENCES . 1/4 X 1/4 ST	54	19	5	2	8	29261.5	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 1/4 X 1/4 ST	t	f	2026-06-03 12:31:54.344996	2026-06-03 12:31:54.345005	59	\N	HOS0074
1202	3	3	MAT-00274	BL LIFESCIENCES . 1/4 X 1/4 WITH LEUR	54	19	5	4	12	27006.57	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 1/4 X 1/4 WITH LEUR	t	f	2026-06-03 12:31:54.346927	2026-06-03 12:31:54.346936	59	\N	HOS0075
1203	3	3	MAT-00275	BL LIFESCIENCES . 1/4 X 1/4 X 1/4  Y	54	19	5	3	11	29504.57	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 1/4 X 1/4 X 1/4  Y	t	f	2026-06-03 12:31:54.34888	2026-06-03 12:31:54.348888	59	\N	HOS0076
1204	3	3	MAT-00276	BL LIFESCIENCES . 3/8 X 3/32  10 FEET TUBING STERILE	54	19	5	2	5	19791.15	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 3/8 X 3/32  10 FEET TUBING STERILE	t	f	2026-06-03 12:31:54.350934	2026-06-03 12:31:54.350943	59	\N	HOS0077
1205	3	3	MAT-00277	BL LIFESCIENCES . 3/8 X 3/8 ST	54	19	5	4	14	15621.87	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 3/8 X 3/8 ST	t	f	2026-06-03 12:31:54.352891	2026-06-03 12:31:54.3529	59	\N	HOS0078
1206	3	3	MAT-00278	BL LIFESCIENCES . 3/8 X 3/8 X 3/8  Y	54	19	5	2	8	20930.03	\N	Covered	\N	12	Consumable	BL LIFESCIENCES . 3/8 X 3/8 X 3/8  Y	t	f	2026-06-03 12:31:54.355293	2026-06-03 12:31:54.355307	59	\N	HOS0079
1207	3	3	MAT-00279	BL LIFESCIENCES BCP 03 WITH HOLDER	54	19	5	3	10	45535.32	\N	Covered	\N	12	Consumable	BL LIFESCIENCES BCP 03 WITH HOLDER	t	f	2026-06-03 12:31:54.357596	2026-06-03 12:31:54.357605	59	\N	HOS0080
1208	3	3	MAT-00280	BL LIFESCIENCES MISTER BLOWER	54	19	5	15	35	8921.51	\N	Covered	\N	12	Consumable	BL LIFESCIENCES MISTER BLOWER	t	f	2026-06-03 12:31:54.35957	2026-06-03 12:31:54.359578	59	\N	HOS0081
1209	3	3	MAT-00281	COOK - ONE-PART PERCUTANEOUS ENTRY THINWALL NEEDLE-SDN-20-4.0 20G/4CM	54	19	5	5	12	11522.83	\N	Covered	\N	12	Consumable	COOK - ONE-PART PERCUTANEOUS ENTRY THINWALL NEEDLE-SDN-20-4.0 20G/4CM	t	f	2026-06-03 12:31:54.361463	2026-06-03 12:31:54.361471	59	\N	HOS0082
1210	3	3	MAT-00282	CORONARY SHUNT - SHT-1210S - 1.0MM	54	19	5	2	7	24375	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1210S - 1.0MM	t	f	2026-06-03 12:31:54.363367	2026-06-03 12:31:54.363375	59	\N	HOS0083
1211	3	3	MAT-00283	CORONARY SHUNT - SHT-1213S - 1.25MM	54	19	5	44	159	9191.76	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1213S - 1.25MM	t	f	2026-06-03 12:31:54.365307	2026-06-03 12:31:54.365316	59	\N	HOS0084
1212	3	3	MAT-00284	CORONARY SHUNT - SHT-1215S - 1.50MM	54	19	5	44	89	7848.13	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1215S - 1.50MM	t	f	2026-06-03 12:31:54.367348	2026-06-03 12:31:54.367357	59	\N	HOS0085
1213	3	3	MAT-00285	CORONARY SHUNT - SHT-1218S - 2.0MM	54	19	5	2	5	49134.49	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1218S - 2.0MM	t	f	2026-06-03 12:31:54.369267	2026-06-03 12:31:54.369275	59	\N	HOS0086
1214	3	3	MAT-00286	CORONARY SHUNT - SHT-1220S - 2.25MM	54	19	5	2	8	10137.59	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1220S - 2.25MM	t	f	2026-06-03 12:31:54.37148	2026-06-03 12:31:54.371493	59	\N	HOS0087
1215	3	3	MAT-00287	CORONARY SHUNT - SHT-1223S - 2.50MM	54	19	5	3	12	32847.94	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1223S - 2.50MM	t	f	2026-06-03 12:31:54.373897	2026-06-03 12:31:54.373906	59	\N	HOS0088
1216	3	3	MAT-00288	CORONARY SHUNT - SHT-1225S - 2.0MM	54	19	5	2	5	15823.34	\N	Covered	\N	12	Consumable	CORONARY SHUNT - SHT-1225S - 2.0MM	t	f	2026-06-03 12:31:54.375898	2026-06-03 12:31:54.375906	59	\N	HOS0089
1217	3	3	MAT-00289	DOLPHIN-RADIL INTRODUCER SHEATH 5F/7CM	54	19	5	4	15	27079.56	\N	Covered	\N	12	Consumable	DOLPHIN-RADIL INTRODUCER SHEATH 5F/7CM	t	f	2026-06-03 12:31:54.377826	2026-06-03 12:31:54.377835	59	\N	HOS0090
1218	3	3	MAT-00290	DVI MALE TO HDMI FEMALE CONVERTOR - NT	54	19	5	5	15	36349.97	\N	Covered	\N	18	Consumable	DVI MALE TO HDMI FEMALE CONVERTOR - NT	t	f	2026-06-03 12:31:54.379747	2026-06-03 12:31:54.379756	59	\N	HOS0091
1219	3	3	MAT-00291	HDMI TO DVI CABLE 20MTR - NT	54	19	5	4	15	12438.79	\N	Covered	\N	18	Consumable	HDMI TO DVI CABLE 20MTR - NT	t	f	2026-06-03 12:31:54.381666	2026-06-03 12:31:54.381675	59	\N	HOS0092
1220	3	3	MAT-00292	HDMI TO HDMI CABLE 20MTR - NT	54	19	5	4	15	11697.61	\N	Covered	\N	18	Consumable	HDMI TO HDMI CABLE 20MTR - NT	t	f	2026-06-03 12:31:54.383653	2026-06-03 12:31:54.383662	59	\N	HOS0093
1221	3	3	MAT-00293	HEAD PROTECTION KIRAN MAKE LEADLITE – 0.25MM PB	54	19	5	4	9	22336.14	\N	Covered	\N	12	Consumable	HEAD PROTECTION KIRAN MAKE LEADLITE – 0.25MM PB	t	f	2026-06-03 12:31:54.385709	2026-06-03 12:31:54.385718	59	\N	HOS0094
1222	3	3	MAT-00294	HIGH PRESSURE LINE (110CMS)	54	19	5	33	101	6342.2	\N	Covered	\N	12	Consumable	HIGH PRESSURE LINE (110CMS)	t	f	2026-06-03 12:31:54.387826	2026-06-03 12:31:54.387838	59	\N	HOS0095
1223	3	3	MAT-00295	HIGH PRESSURE LINE 150CM 1200 PSI	54	19	5	3	11	45511.21	\N	Covered	\N	12	Consumable	HIGH PRESSURE LINE 150CM 1200 PSI	t	f	2026-06-03 12:31:54.390291	2026-06-03 12:31:54.3903	59	\N	HOS0096
1224	3	3	MAT-00296	INTRODUCER SHEATH 9F X 11CM	54	19	5	2	6	17512.4	\N	Covered	\N	12	Consumable	INTRODUCER SHEATH 9F X 11CM	t	f	2026-06-03 12:31:54.392249	2026-06-03 12:31:54.392258	59	\N	HOS0097
1225	3	3	MAT-00297	MANIFOLD 3 PORT	54	19	5	20	60	5485.15	\N	Covered	\N	12	Consumable	MANIFOLD 3 PORT	t	f	2026-06-03 12:31:54.394215	2026-06-03 12:31:54.394224	59	\N	HOS0098
1226	3	3	MAT-00298	MEDICAL BED ROLLS - 10 ROLLS PACKING	54	26	5	4	16	47181.69	\N	Covered	\N	5	Consumable	MEDICAL BED ROLLS - 10 ROLLS PACKING	t	f	2026-06-03 12:31:54.396119	2026-06-03 12:31:54.396128	59	\N	HOS0099
1227	3	3	MAT-00299	MERIT MANIFOLDS 200PSI, 3PORT, HALF BODY, RIGHT OFF(25NOS/BOX)- 203HF-R	54	19	5	5	20	40224.69	\N	Covered	\N	12	Consumable	MERIT MANIFOLDS 200PSI, 3PORT, HALF BODY, RIGHT OFF(25NOS/BOX)- 203HF-R	t	f	2026-06-03 12:31:54.397998	2026-06-03 12:31:54.398007	59	\N	HOS0100
1228	3	3	MAT-00300	OMNIPAQUE 350MG*100ML-LONG	54	19	5	5	19	38349.89	\N	Covered	\N	12	Consumable	OMNIPAQUE 350MG*100ML-LONG	t	f	2026-06-03 12:31:54.399927	2026-06-03 12:31:54.399936	59	\N	HOS0101
1229	3	3	MAT-00301	PATIENT SAFE SLIDE TRANSFER BOARD	54	19	5	2	5	15566.94	\N	Covered	\N	12	Consumable	PATIENT SAFE SLIDE TRANSFER BOARD	t	f	2026-06-03 12:31:54.402018	2026-06-03 12:31:54.402027	59	\N	HOS0102
1230	3	3	MAT-00302	PRESSURE MONITORING KIT - DOUBLE LUMEN	54	19	5	2	6	35100.21	\N	Covered	\N	12	Consumable	PRESSURE MONITORING KIT - DOUBLE LUMEN	t	f	2026-06-03 12:31:54.404	2026-06-03 12:31:54.404011	59	\N	HOS0103
1231	3	3	MAT-00303	SAPPHIRE BALLOON NC 2.0 X  8MM	54	19	5	3	11	40772.13	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.0 X  8MM	t	f	2026-06-03 12:31:54.406552	2026-06-03 12:31:54.406562	59	\N	HOS0104
1232	3	3	MAT-00304	SAPPHIRE BALLOON NC 2.0 X 10MM	54	19	5	5	17	19046.55	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.0 X 10MM	t	f	2026-06-03 12:31:54.40856	2026-06-03 12:31:54.408569	59	\N	HOS0105
1233	3	3	MAT-00305	SAPPHIRE BALLOON NC 2.0 X 15MM	54	19	5	5	15	42810.99	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.0 X 15MM	t	f	2026-06-03 12:31:54.410495	2026-06-03 12:31:54.410505	59	\N	HOS0106
1234	3	3	MAT-00306	SAPPHIRE BALLOON NC 2.5 X 10MM	54	19	5	40	145	9177.82	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.5 X 10MM	t	f	2026-06-03 12:31:54.412428	2026-06-03 12:31:54.412437	59	\N	HOS0107
1235	3	3	MAT-00307	SAPPHIRE BALLOON NC 2.5 X 12MM	54	19	5	5	14	38376.24	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.5 X 12MM	t	f	2026-06-03 12:31:54.414328	2026-06-03 12:31:54.414337	59	\N	HOS0108
1236	3	3	MAT-00308	SAPPHIRE BALLOON NC 2.5 X 15MM	54	19	5	5	12	32018.21	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.5 X 15MM	t	f	2026-06-03 12:31:54.416239	2026-06-03 12:31:54.416248	59	\N	HOS0109
1237	3	3	MAT-00309	SAPPHIRE BALLOON NC 2.5 X 8MM	54	19	5	35	103	5872.24	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.5 X 8MM	t	f	2026-06-03 12:31:54.418335	2026-06-03 12:31:54.418344	59	\N	HOS0110
1238	3	3	MAT-00310	SAPPHIRE BALLOON NC 2.75 X 10MM	54	19	5	35	121	7045.4	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.75 X 10MM	t	f	2026-06-03 12:31:54.420282	2026-06-03 12:31:54.420291	59	\N	HOS0111
1239	3	3	MAT-00311	SAPPHIRE BALLOON NC 2.75 X 12MM	54	19	5	3	12	20068.58	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.75 X 12MM	t	f	2026-06-03 12:31:54.422654	2026-06-03 12:31:54.422682	59	\N	HOS0112
1240	3	3	MAT-00312	SAPPHIRE BALLOON NC 2.75 X 15MM	54	19	5	4	9	30408.41	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.75 X 15MM	t	f	2026-06-03 12:31:54.42483	2026-06-03 12:31:54.424839	59	\N	HOS0113
1241	3	3	MAT-00313	SAPPHIRE BALLOON NC 2.75 X 8MM	54	19	5	2	7	35600.43	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 2.75 X 8MM	t	f	2026-06-03 12:31:54.426791	2026-06-03 12:31:54.426799	59	\N	HOS0114
1242	3	3	MAT-00314	SAPPHIRE BALLOON NC 3.0 X 10MM	54	19	5	3	7	31429.34	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.0 X 10MM	t	f	2026-06-03 12:31:54.428712	2026-06-03 12:31:54.428721	59	\N	HOS0115
1243	3	3	MAT-00315	SAPPHIRE BALLOON NC 3.0 X 12MM	54	19	5	5	16	19713.24	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.0 X 12MM	t	f	2026-06-03 12:31:54.430659	2026-06-03 12:31:54.430668	59	\N	HOS0116
1244	3	3	MAT-00316	SAPPHIRE BALLOON NC 3.0 X 15MM	54	19	5	4	9	23819.89	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.0 X 15MM	t	f	2026-06-03 12:31:54.432526	2026-06-03 12:31:54.432535	59	\N	HOS0117
1245	3	3	MAT-00317	SAPPHIRE BALLOON NC 3.0 X 8MM	54	19	5	22	50	5278.34	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.0 X 8MM	t	f	2026-06-03 12:31:54.434613	2026-06-03 12:31:54.434622	59	\N	HOS0118
1246	3	3	MAT-00318	SAPPHIRE BALLOON NC 3.5 X 10MM	54	19	5	29	76	5831.78	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.5 X 10MM	t	f	2026-06-03 12:31:54.436576	2026-06-03 12:31:54.436585	59	\N	HOS0119
1247	3	3	MAT-00319	SAPPHIRE BALLOON NC 3.5 X 12MM	54	19	5	3	9	15726.17	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.5 X 12MM	t	f	2026-06-03 12:31:54.438865	2026-06-03 12:31:54.438877	59	\N	HOS0120
1248	3	3	MAT-00320	SAPPHIRE BALLOON NC 3.5 X 15MM	54	19	5	49	150	9807.13	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.5 X 15MM	t	f	2026-06-03 12:31:54.441223	2026-06-03 12:31:54.441232	59	\N	HOS0121
1249	3	3	MAT-00321	SAPPHIRE BALLOON NC 3.5 X 8MM	54	19	5	2	6	11644.53	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 3.5 X 8MM	t	f	2026-06-03 12:31:54.44321	2026-06-03 12:31:54.443218	59	\N	HOS0122
1250	3	3	MAT-00322	SAPPHIRE BALLOON NC 4.0 X 10MM	54	19	5	4	11	28227.78	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 4.0 X 10MM	t	f	2026-06-03 12:31:54.445096	2026-06-03 12:31:54.445105	59	\N	HOS0123
1251	3	3	MAT-00323	SAPPHIRE BALLOON NC 4.0 X 12MM	54	19	5	5	20	29696.2	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 4.0 X 12MM	t	f	2026-06-03 12:31:54.446917	2026-06-03 12:31:54.446926	59	\N	HOS0124
1252	3	3	MAT-00324	SAPPHIRE BALLOON NC 4.0 X 15MM	54	19	5	37	138	5578.79	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 4.0 X 15MM	t	f	2026-06-03 12:31:54.448824	2026-06-03 12:31:54.448833	59	\N	HOS0125
1253	3	3	MAT-00325	SAPPHIRE BALLOON NC 4.0 X 8MM	54	19	5	39	87	5694.61	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON NC 4.0 X 8MM	t	f	2026-06-03 12:31:54.45079	2026-06-03 12:31:54.4508	59	\N	HOS0126
1254	3	3	MAT-00326	SAPPHIRE BALLOON SC 1.25 X 10MM	54	19	5	2	5	28293.36	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.25 X 10MM	t	f	2026-06-03 12:31:54.452795	2026-06-03 12:31:54.452803	59	\N	HOS0127
1255	3	3	MAT-00327	SAPPHIRE BALLOON SC 1.25 X 12MM	54	19	5	2	6	20721.93	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.25 X 12MM	t	f	2026-06-03 12:31:54.454877	2026-06-03 12:31:54.454888	59	\N	HOS0128
1256	3	3	MAT-00328	SAPPHIRE BALLOON SC 1.25 X 15MM	54	19	5	2	8	37570.34	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.25 X 15MM	t	f	2026-06-03 12:31:54.457379	2026-06-03 12:31:54.457387	59	\N	HOS0129
1257	3	3	MAT-00329	SAPPHIRE BALLOON SC 1.5 X 10MM	54	19	5	2	6	31807.89	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.5 X 10MM	t	f	2026-06-03 12:31:54.459399	2026-06-03 12:31:54.459408	59	\N	HOS0130
1258	3	3	MAT-00330	SAPPHIRE BALLOON SC 1.5 X 12MM	54	19	5	12	26	9579.32	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.5 X 12MM	t	f	2026-06-03 12:31:54.461377	2026-06-03 12:31:54.461385	59	\N	HOS0131
1259	3	3	MAT-00331	SAPPHIRE BALLOON SC 1.5 X 15MM	54	19	5	3	11	41669.52	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.5 X 15MM	t	f	2026-06-03 12:31:54.46331	2026-06-03 12:31:54.463319	59	\N	HOS0132
1260	3	3	MAT-00332	SAPPHIRE BALLOON SC 1.5 X 8MM	54	19	5	2	5	15241.99	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 1.5 X 8MM	t	f	2026-06-03 12:31:54.465219	2026-06-03 12:31:54.465228	59	\N	HOS0133
1261	3	3	MAT-00333	SAPPHIRE BALLOON SC 2.0 X 10MM	54	19	5	2	6	20174.98	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.0 X 10MM	t	f	2026-06-03 12:31:54.467206	2026-06-03 12:31:54.467216	59	\N	HOS0134
1262	3	3	MAT-00334	SAPPHIRE BALLOON SC 2.0 X 12MM	54	19	5	2	8	49190.09	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.0 X 12MM	t	f	2026-06-03 12:31:54.469205	2026-06-03 12:31:54.469215	59	\N	HOS0135
1263	3	3	MAT-00335	SAPPHIRE BALLOON SC 2.0 X 15MM	54	19	5	4	10	48065.39	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.0 X 15MM	t	f	2026-06-03 12:31:54.471469	2026-06-03 12:31:54.471482	59	\N	HOS0136
1264	3	3	MAT-00336	SAPPHIRE BALLOON SC 2.0 X 8MM	54	19	5	2	8	22533.69	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.0 X 8MM	t	f	2026-06-03 12:31:54.473991	2026-06-03 12:31:54.474	59	\N	HOS0137
1265	3	3	MAT-00337	SAPPHIRE BALLOON SC 2.5 X 10MM	54	19	5	3	9	38005.95	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.5 X 10MM	t	f	2026-06-03 12:31:54.476011	2026-06-03 12:31:54.476019	59	\N	HOS0138
1266	3	3	MAT-00338	SAPPHIRE BALLOON SC 2.5 X 12MM	54	19	5	3	8	28522.88	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.5 X 12MM	t	f	2026-06-03 12:31:54.477955	2026-06-03 12:31:54.477964	59	\N	HOS0139
1267	3	3	MAT-00339	SAPPHIRE BALLOON SC 2.5 X 15MM	54	19	5	3	10	13460.5	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.5 X 15MM	t	f	2026-06-03 12:31:54.479875	2026-06-03 12:31:54.479883	59	\N	HOS0140
1268	3	3	MAT-00340	SAPPHIRE BALLOON SC 2.5 X 8MM	54	19	5	3	11	23367.64	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.5 X 8MM	t	f	2026-06-03 12:31:54.481762	2026-06-03 12:31:54.48177	59	\N	HOS0141
1269	3	3	MAT-00341	SAPPHIRE BALLOON SC 2.75 X 10MM	54	19	5	4	15	34558.77	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.75 X 10MM	t	f	2026-06-03 12:31:54.48373	2026-06-03 12:31:54.48374	59	\N	HOS0142
1270	3	3	MAT-00342	SAPPHIRE BALLOON SC 2.75 X 12MM	54	19	5	5	17	37307.58	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.75 X 12MM	t	f	2026-06-03 12:31:54.485783	2026-06-03 12:31:54.485792	59	\N	HOS0143
1271	3	3	MAT-00343	SAPPHIRE BALLOON SC 2.75 X 15MM	54	19	5	2	6	43673.19	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.75 X 15MM	t	f	2026-06-03 12:31:54.487936	2026-06-03 12:31:54.487948	59	\N	HOS0144
1272	3	3	MAT-00344	SAPPHIRE BALLOON SC 2.75 X 8MM	54	19	5	3	10	41474.27	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 2.75 X 8MM	t	f	2026-06-03 12:31:54.490405	2026-06-03 12:31:54.490414	59	\N	HOS0145
1273	3	3	MAT-00345	SAPPHIRE BALLOON SC 3.0 X 10 MM	54	19	5	4	12	30601.76	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.0 X 10 MM	t	f	2026-06-03 12:31:54.492435	2026-06-03 12:31:54.492444	59	\N	HOS0146
1274	3	3	MAT-00346	SAPPHIRE BALLOON SC 3.0 X 12 MM	54	19	5	10	40	9574.71	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.0 X 12 MM	t	f	2026-06-03 12:31:54.494394	2026-06-03 12:31:54.494403	59	\N	HOS0147
1275	3	3	MAT-00347	SAPPHIRE BALLOON SC 3.0 X 15 MM	54	19	5	3	7	14873.99	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.0 X 15 MM	t	f	2026-06-03 12:31:54.496195	2026-06-03 12:31:54.496204	59	\N	HOS0148
1276	3	3	MAT-00348	SAPPHIRE BALLOON SC 3.0 X 8 MM	54	19	5	3	8	13931.39	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.0 X 8 MM	t	f	2026-06-03 12:31:54.498119	2026-06-03 12:31:54.498128	59	\N	HOS0149
1277	3	3	MAT-00349	SAPPHIRE BALLOON SC 3.5 X 10 MM	54	19	5	2	7	19344.59	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.5 X 10 MM	t	f	2026-06-03 12:31:54.500024	2026-06-03 12:31:54.500032	59	\N	HOS0150
1278	3	3	MAT-00350	SAPPHIRE BALLOON SC 3.5 X 12 MM	54	19	5	2	6	41821.12	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.5 X 12 MM	t	f	2026-06-03 12:31:54.502165	2026-06-03 12:31:54.502173	59	\N	HOS0151
1279	3	3	MAT-00351	SAPPHIRE BALLOON SC 3.5 X 15 MM	54	19	5	4	12	43020.18	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.5 X 15 MM	t	f	2026-06-03 12:31:54.504287	2026-06-03 12:31:54.504297	59	\N	HOS0152
1280	3	3	MAT-00352	SAPPHIRE BALLOON SC 3.5 X 8MM	54	19	5	3	8	44607.31	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 3.5 X 8MM	t	f	2026-06-03 12:31:54.50671	2026-06-03 12:31:54.50672	59	\N	HOS0153
1281	3	3	MAT-00353	SAPPHIRE BALLOON SC 4.0 X 10 MM	54	19	5	4	14	11280.13	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 4.0 X 10 MM	t	f	2026-06-03 12:31:54.508831	2026-06-03 12:31:54.50884	59	\N	HOS0154
1282	3	3	MAT-00354	SAPPHIRE BALLOON SC 4.0 X 12 MM	54	19	5	5	16	25264.08	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 4.0 X 12 MM	t	f	2026-06-03 12:31:54.510794	2026-06-03 12:31:54.510803	59	\N	HOS0155
1283	3	3	MAT-00355	SAPPHIRE BALLOON SC 4.0 X 15 MM	54	19	5	4	12	28093.07	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 4.0 X 15 MM	t	f	2026-06-03 12:31:54.512717	2026-06-03 12:31:54.512726	59	\N	HOS0156
1284	3	3	MAT-00356	SAPPHIRE BALLOON SC 4.0 X 8 MM	54	19	5	4	16	41898.91	\N	Covered	\N	12	Consumable	SAPPHIRE BALLOON SC 4.0 X 8 MM	t	f	2026-06-03 12:31:54.514649	2026-06-03 12:31:54.514657	59	\N	HOS0157
1285	3	3	MAT-00357	SCANLAN AORTIC PUNCH 2.5MM	54	19	5	5	12	34292.15	\N	Covered	\N	12	Consumable	SCANLAN AORTIC PUNCH 2.5MM	t	f	2026-06-03 12:31:54.51654	2026-06-03 12:31:54.516549	59	\N	HOS0158
1286	3	3	MAT-00358	SCANLAN AORTIC PUNCH 3.0MM	54	19	5	3	7	45470.55	\N	Covered	\N	12	Consumable	SCANLAN AORTIC PUNCH 3.0MM	t	f	2026-06-03 12:31:54.518609	2026-06-03 12:31:54.518618	59	\N	HOS0159
1287	3	3	MAT-00359	SCANLAN AORTIC PUNCH 3.5MM	54	19	5	2	6	15175.95	\N	Covered	\N	12	Consumable	SCANLAN AORTIC PUNCH 3.5MM	t	f	2026-06-03 12:31:54.520599	2026-06-03 12:31:54.520608	59	\N	HOS0160
1288	3	3	MAT-00360	STENT 2.5X32MM	54	19	5	3	7	21265.62	\N	Covered	\N	12	Consumable	STENT 2.5X32MM	t	f	2026-06-03 12:31:54.523033	2026-06-03 12:31:54.523046	59	\N	HOS0161
1289	3	3	MAT-00361	STENT 2.75 X 28MM	54	19	5	4	15	40111.37	\N	Covered	\N	12	Consumable	STENT 2.75 X 28MM	t	f	2026-06-03 12:31:54.525257	2026-06-03 12:31:54.525266	59	\N	HOS0162
1290	3	3	MAT-00362	STENT 2.75 X 36 MM	54	19	5	4	9	38848.81	\N	Covered	\N	12	Consumable	STENT 2.75 X 36 MM	t	f	2026-06-03 12:31:54.527208	2026-06-03 12:31:54.527217	59	\N	HOS0163
1291	3	3	MAT-00363	STENT 2.75 X 44 MM	54	19	5	4	13	37241.53	\N	Covered	\N	12	Consumable	STENT 2.75 X 44 MM	t	f	2026-06-03 12:31:54.529011	2026-06-03 12:31:54.529019	59	\N	HOS0164
1292	3	3	MAT-00364	STENT 2.75X13MM	54	19	5	45	178	9463.92	\N	Covered	\N	12	Consumable	STENT 2.75X13MM	t	f	2026-06-03 12:31:54.530855	2026-06-03 12:31:54.530863	59	\N	HOS0165
1293	3	3	MAT-00365	STENT 2.75X16MM	54	19	5	5	19	41195.94	\N	Covered	\N	12	Consumable	STENT 2.75X16MM	t	f	2026-06-03 12:31:54.532662	2026-06-03 12:31:54.53267	59	\N	HOS0166
1294	3	3	MAT-00366	STENT 2.75X24MM	54	19	5	5	14	38265.57	\N	Covered	\N	12	Consumable	STENT 2.75X24MM	t	f	2026-06-03 12:31:54.534668	2026-06-03 12:31:54.534677	59	\N	HOS0167
1295	3	3	MAT-00367	STENT 2.75X32MM	54	19	5	28	96	5050.55	\N	Covered	\N	12	Consumable	STENT 2.75X32MM	t	f	2026-06-03 12:31:54.536683	2026-06-03 12:31:54.536692	59	\N	HOS0168
1296	3	3	MAT-00368	STENT 3.0 X 10 MM	54	19	5	5	19	27948.52	\N	Covered	\N	12	Consumable	STENT 3.0 X 10 MM	t	f	2026-06-03 12:31:54.538878	2026-06-03 12:31:54.53889	59	\N	HOS0169
1297	3	3	MAT-00369	STENT 3.0 X 44 MM	54	19	5	2	8	23100.77	\N	Covered	\N	12	Consumable	STENT 3.0 X 44 MM	t	f	2026-06-03 12:31:54.5413	2026-06-03 12:31:54.541308	59	\N	HOS0170
1298	3	3	MAT-00370	STENT 3.0X18MM	54	19	5	3	10	25471.61	\N	Covered	\N	12	Consumable	STENT 3.0X18MM	t	f	2026-06-03 12:31:54.543201	2026-06-03 12:31:54.54321	59	\N	HOS0171
1299	3	3	MAT-00371	STENT 3.0X24MM	54	19	5	4	15	22018.67	\N	Covered	\N	12	Consumable	STENT 3.0X24MM	t	f	2026-06-03 12:31:54.545104	2026-06-03 12:31:54.545112	59	\N	HOS0172
1300	3	3	MAT-00372	STENT 3.0X28MM	54	19	5	2	5	48491.89	\N	Covered	\N	12	Consumable	STENT 3.0X28MM	t	f	2026-06-03 12:31:54.546991	2026-06-03 12:31:54.546999	59	\N	HOS0173
1301	3	3	MAT-00373	STENT 3.0X32MM	54	19	5	4	15	40780.68	\N	Covered	\N	12	Consumable	STENT 3.0X32MM	t	f	2026-06-03 12:31:54.548907	2026-06-03 12:31:54.548916	59	\N	HOS0174
1302	3	3	MAT-00374	STENT 3.0X40MM	54	19	5	2	6	15985.82	\N	Covered	\N	12	Consumable	STENT 3.0X40MM	t	f	2026-06-03 12:31:54.550896	2026-06-03 12:31:54.550906	59	\N	HOS0175
1303	3	3	MAT-00375	STENT 3.5 X 10 MM	54	19	5	4	13	37041.39	\N	Covered	\N	12	Consumable	STENT 3.5 X 10 MM	t	f	2026-06-03 12:31:54.55295	2026-06-03 12:31:54.552959	59	\N	HOS0176
1304	3	3	MAT-00376	STENT 3.5 X 15 MM	54	19	5	3	12	16801.56	\N	Covered	\N	12	Consumable	STENT 3.5 X 15 MM	t	f	2026-06-03 12:31:54.555105	2026-06-03 12:31:54.555116	59	\N	HOS0177
1305	3	3	MAT-00377	STENT 3.5 X 28 MM	54	19	5	5	14	26453.15	\N	Covered	\N	12	Consumable	STENT 3.5 X 28 MM	t	f	2026-06-03 12:31:54.557653	2026-06-03 12:31:54.557662	59	\N	HOS0178
1306	3	3	MAT-00378	STENT 3.5X14MM	54	19	5	2	5	27590	\N	Covered	\N	12	Consumable	STENT 3.5X14MM	t	f	2026-06-03 12:31:54.559684	2026-06-03 12:31:54.559692	59	\N	HOS0179
1307	3	3	MAT-00379	STENT 3.5X16MM	54	19	5	4	16	16861.54	\N	Covered	\N	12	Consumable	STENT 3.5X16MM	t	f	2026-06-03 12:31:54.561682	2026-06-03 12:31:54.56169	59	\N	HOS0180
1308	3	3	MAT-00380	STENT 3.5X18MM	54	19	5	3	10	41863.62	\N	Covered	\N	12	Consumable	STENT 3.5X18MM	t	f	2026-06-03 12:31:54.563614	2026-06-03 12:31:54.563622	59	\N	HOS0181
1311	3	3	MAT-00383	STENT 3.5X32MM	54	19	5	4	13	11109.34	\N	Covered	\N	12	Consumable	STENT 3.5X32MM	t	f	2026-06-03 12:31:54.569842	2026-06-03 12:31:54.56985	59	\N	HOS0184
1312	3	3	MAT-00384	STENT 4.0 X 16 MM	54	19	5	5	17	43194.14	\N	Covered	\N	12	Consumable	STENT 4.0 X 16 MM	t	f	2026-06-03 12:31:54.572029	2026-06-03 12:31:54.57204	59	\N	HOS0185
1313	3	3	MAT-00385	TERUMO I KARI IL 3.5 - 5FR	54	19	5	3	8	24850.98	\N	Covered	\N	12	Consumable	TERUMO I KARI IL 3.5 - 5FR	t	f	2026-06-03 12:31:54.574506	2026-06-03 12:31:54.574515	59	\N	HOS0186
1314	3	3	MAT-00386	TERUMO I KARI IL 3.5 - 6FR	54	19	5	5	12	27882.31	\N	Covered	\N	12	Consumable	TERUMO I KARI IL 3.5 - 6FR	t	f	2026-06-03 12:31:54.576492	2026-06-03 12:31:54.576501	59	\N	HOS0187
1315	3	3	MAT-00387	TERUMO I KARI IR 1.5 - 5FR	54	19	5	5	17	45006.67	\N	Covered	\N	12	Consumable	TERUMO I KARI IR 1.5 - 5FR	t	f	2026-06-03 12:31:54.57841	2026-06-03 12:31:54.578418	59	\N	HOS0188
1316	3	3	MAT-00388	TERUMO J.TIP 0.35X150	54	19	5	15	37	5319.92	\N	Covered	\N	12	Consumable	TERUMO J.TIP 0.35X150	t	f	2026-06-03 12:31:54.580351	2026-06-03 12:31:54.580359	59	\N	HOS0189
1317	3	3	MAT-00389	TOP MANIFOLD 3 PORT	54	19	5	3	9	34938.16	\N	Covered	\N	12	Consumable	TOP MANIFOLD 3 PORT	t	f	2026-06-03 12:31:54.582242	2026-06-03 12:31:54.582251	59	\N	HOS0190
1318	3	3	MAT-00390	TPI  - PACEL 5F (BALLOON TIP)	54	19	5	5	14	34169.31	\N	Covered	\N	12	Consumable	TPI  - PACEL 5F (BALLOON TIP)	t	f	2026-06-03 12:31:54.584191	2026-06-03 12:31:54.584201	59	\N	HOS0191
1319	3	3	MAT-00391	TRANSDUCER KIT	54	19	5	5	12	32530.49	\N	Covered	\N	12	Consumable	TRANSDUCER KIT	t	f	2026-06-03 12:31:54.586155	2026-06-03 12:31:54.586163	59	\N	HOS0192
1320	3	3	MAT-00392	ULTRA FLEX IABP 7.5 X 40 CC - ARROW MAKE	54	19	5	4	16	49380.3	\N	Covered	\N	12	Consumable	ULTRA FLEX IABP 7.5 X 40 CC - ARROW MAKE	t	f	2026-06-03 12:31:54.588152	2026-06-03 12:31:54.588162	59	\N	HOS0193
1321	3	3	MAT-00393	VISIPAQUE 320MG*100ML-LONG	54	19	5	2	7	15551.72	\N	Covered	\N	12	Consumable	VISIPAQUE 320MG*100ML-LONG	t	f	2026-06-03 12:31:54.590646	2026-06-03 12:31:54.590656	59	\N	HOS0194
1322	3	3	MAT-00394	VISIPAQUE 50ML	54	19	5	5	19	17174.45	\N	Covered	\N	12	Consumable	VISIPAQUE 50ML	t	f	2026-06-03 12:31:54.592684	2026-06-03 12:31:54.592693	59	\N	HOS0195
1323	3	3	MAT-00395	2X2 DOOR GASKET FOR BIG MACHINE	54	20	5	4	14	24028.99	\N	Covered	\N	18	Consumable	2X2 DOOR GASKET FOR BIG MACHINE	t	f	2026-06-03 12:31:54.59463	2026-06-03 12:31:54.594639	59	\N	HOS0196
1324	3	3	MAT-00396	BLADE FOR GUAGE CUTTING MACHINE	54	20	5	5	19	13635.13	\N	Covered	\N	18	Consumable	BLADE FOR GUAGE CUTTING MACHINE	t	f	2026-06-03 12:31:54.596527	2026-06-03 12:31:54.596535	59	\N	HOS0197
1325	3	3	MAT-00397	BOILER GASKET - SMALL MACHINE	54	20	5	2	7	10767.58	\N	Covered	\N	18	Consumable	BOILER GASKET - SMALL MACHINE	t	f	2026-06-03 12:31:54.598394	2026-06-03 12:31:54.598403	59	\N	HOS0198
1326	3	3	MAT-00398	BOLT & NUTS	54	20	6	2	6	34882.18	\N	Covered	\N	18	Consumable	BOLT & NUTS	t	f	2026-06-03 12:31:54.600323	2026-06-03 12:31:54.600332	59	\N	HOS0199
1327	3	3	MAT-00399	BRAIDED TUBE 1/2" X 2 MTRS	54	20	5	4	12	22125.42	\N	Covered	\N	18	Consumable	BRAIDED TUBE 1/2" X 2 MTRS	t	f	2026-06-03 12:31:54.602386	2026-06-03 12:31:54.602395	59	\N	HOS0200
1328	3	3	MAT-00400	BROWN TEFLON BELT- SEALING MACHINE	54	20	5	2	8	27741.37	\N	Covered	\N	18	Consumable	BROWN TEFLON BELT- SEALING MACHINE	t	f	2026-06-03 12:31:54.604427	2026-06-03 12:31:54.604443	59	\N	HOS0201
1329	3	3	MAT-00401	LOW WATER CUT OFF - SENSOR TYPE	54	20	5	3	9	42545.35	\N	Covered	\N	18	Consumable	LOW WATER CUT OFF - SENSOR TYPE	t	f	2026-06-03 12:31:54.606879	2026-06-03 12:31:54.60689	59	\N	HOS0202
1330	3	3	MAT-00402	OPERATING VALVE GASKET - BIG	54	20	5	3	11	40105.74	\N	Covered	\N	18	Consumable	OPERATING VALVE GASKET - BIG	t	f	2026-06-03 12:31:54.609045	2026-06-03 12:31:54.609054	59	\N	HOS0203
1331	3	3	MAT-00403	PRINTING ROLLS ETO MACHINE	54	20	5	3	10	49267.01	\N	Covered	\N	18	Consumable	PRINTING ROLLS ETO MACHINE	t	f	2026-06-03 12:31:54.61101	2026-06-03 12:31:54.611018	59	\N	HOS0204
1332	3	3	MAT-00404	SAFETY VALVE	54	20	5	2	5	27360.66	\N	Covered	\N	18	Consumable	SAFETY VALVE	t	f	2026-06-03 12:31:54.612921	2026-06-03 12:31:54.612929	59	\N	HOS0205
1333	3	3	MAT-00405	SHARPENER BELT FOR GUAGE CUTTING MACHINE	54	20	5	30	89	8664.4	\N	Covered	\N	18	Consumable	SHARPENER BELT FOR GUAGE CUTTING MACHINE	t	f	2026-06-03 12:31:54.614841	2026-06-03 12:31:54.614849	59	\N	HOS0206
1334	3	3	MAT-00406	SILICON GASKET FOR HEATER	54	20	5	2	8	49305.41	\N	Covered	\N	18	Consumable	SILICON GASKET FOR HEATER	t	f	2026-06-03 12:31:54.61674	2026-06-03 12:31:54.616749	59	\N	HOS0207
1335	3	3	MAT-00407	SILICON WHEEL FOR SEALING MACHINE	54	20	5	3	7	20126.75	\N	Covered	\N	18	Consumable	SILICON WHEEL FOR SEALING MACHINE	t	f	2026-06-03 12:31:54.618785	2026-06-03 12:31:54.618794	59	\N	HOS0208
1336	3	3	MAT-00408	TEFLON TAPE ROLL(SMALL MACHINE)	54	20	12	4	13	47865.15	\N	Covered	\N	18	Consumable	TEFLON TAPE ROLL(SMALL MACHINE)	t	f	2026-06-03 12:31:54.620715	2026-06-03 12:31:54.620723	59	\N	HOS0209
1337	3	3	MAT-00409	ASSEMBLIES ORTHO DIRECT	54	21	5	3	8	13569.44	\N	Covered	\N	12	Consumable	ASSEMBLIES ORTHO DIRECT	t	f	2026-06-03 12:31:54.623003	2026-06-03 12:31:54.623015	59	\N	HOS0210
1338	3	3	MAT-00410	BAND SEATER GDC	54	21	5	3	11	12025.08	\N	Covered	\N	12	Consumable	BAND SEATER GDC	t	f	2026-06-03 12:31:54.625289	2026-06-03 12:31:54.625297	59	\N	HOS0211
1339	3	3	MAT-00411	BLUE BITE	54	21	5	3	10	11895.17	\N	Covered	\N	12	Consumable	BLUE BITE	t	f	2026-06-03 12:31:54.627172	2026-06-03 12:31:54.62718	59	\N	HOS0212
1340	3	3	MAT-00412	BONDABLE 1ST MOLAR TUBES D-TECH	54	21	5	3	9	13847.05	\N	Covered	\N	12	Consumable	BONDABLE 1ST MOLAR TUBES D-TECH	t	f	2026-06-03 12:31:54.62904	2026-06-03 12:31:54.629049	59	\N	HOS0213
1341	3	3	MAT-00413	BONDABLE BUTTONS PKT OF 10	54	21	5	4	13	10652.57	\N	Covered	\N	12	Consumable	BONDABLE BUTTONS PKT OF 10	t	f	2026-06-03 12:31:54.630878	2026-06-03 12:31:54.630887	59	\N	HOS0214
1342	3	3	MAT-00414	BRACKET IRIDIUM MBT 022 KIT	54	21	5	2	6	13179.23	\N	Covered	\N	12	Consumable	BRACKET IRIDIUM MBT 022 KIT	t	f	2026-06-03 12:31:54.632736	2026-06-03 12:31:54.632745	59	\N	HOS0215
1343	3	3	MAT-00415	CERAMIC KIT MBT 022 5-5	54	21	5	22	54	7056.16	\N	Covered	\N	12	Consumable	CERAMIC KIT MBT 022 5-5	t	f	2026-06-03 12:31:54.634763	2026-06-03 12:31:54.634772	59	\N	HOS0216
1344	3	3	MAT-00416	CHEEK RETRACTOR WITH HANDLE	54	21	5	2	5	28137.67	\N	Covered	\N	12	Consumable	CHEEK RETRACTOR WITH HANDLE	t	f	2026-06-03 12:31:54.636713	2026-06-03 12:31:54.636721	59	\N	HOS0217
1345	3	3	MAT-00417	CRIMPING PLIER	54	21	5	3	10	43834.48	\N	Covered	\N	12	Consumable	CRIMPING PLIER	t	f	2026-06-03 12:31:54.638756	2026-06-03 12:31:54.638768	59	\N	HOS0218
1346	3	3	MAT-00418	DEBONDING BUR HORICO	54	21	5	5	14	14390.92	\N	Covered	\N	12	Consumable	DEBONDING BUR HORICO	t	f	2026-06-03 12:31:54.64121	2026-06-03 12:31:54.641221	59	\N	HOS0219
1347	3	3	MAT-00419	DENTAL PENCIL	54	21	5	2	5	29772.16	\N	Covered	\N	12	Consumable	DENTAL PENCIL	t	f	2026-06-03 12:31:54.643539	2026-06-03 12:31:54.64355	59	\N	HOS0220
1348	3	3	MAT-00420	D-TECH ROTH KIT 018	54	21	5	3	8	32447.26	\N	Covered	\N	12	Consumable	D-TECH ROTH KIT 018	t	f	2026-06-03 12:31:54.645698	2026-06-03 12:31:54.645707	59	\N	HOS0221
1349	3	3	MAT-00421	E-CHAIN OO 15FT- CONT. CLEAR & GREY	54	21	5	4	15	20626.7	\N	Covered	\N	12	Consumable	E-CHAIN OO 15FT- CONT. CLEAR & GREY	t	f	2026-06-03 12:31:54.647787	2026-06-03 12:31:54.647795	59	\N	HOS0222
1350	3	3	MAT-00422	E-CHAIN OO 15FT- SHORT. CLEAR & GREY	54	21	5	2	5	32134.02	\N	Covered	\N	12	Consumable	E-CHAIN OO 15FT- SHORT. CLEAR & GREY	t	f	2026-06-03 12:31:54.650078	2026-06-03 12:31:54.650097	59	\N	HOS0223
1351	3	3	MAT-00423	ENLIGHT LC COMPOSITE KIT ORMCO WITH ETCHANT	54	21	5	3	9	45420.78	\N	Covered	\N	12	Consumable	ENLIGHT LC COMPOSITE KIT ORMCO WITH ETCHANT	t	f	2026-06-03 12:31:54.652632	2026-06-03 12:31:54.652641	59	\N	HOS0224
1352	3	3	MAT-00424	HOE PLIER GDC STR/CVD	54	21	5	4	9	32274.05	\N	Covered	\N	12	Consumable	HOE PLIER GDC STR/CVD	t	f	2026-06-03 12:31:54.654737	2026-06-03 12:31:54.654748	59	\N	HOS0225
1353	3	3	MAT-00425	HORICO FG BU 166 010	54	21	5	30	105	5532.71	\N	Covered	\N	12	Consumable	HORICO FG BU 166 010	t	f	2026-06-03 12:31:54.657306	2026-06-03 12:31:54.657317	59	\N	HOS0226
1354	3	3	MAT-00426	HP ELASTIC 5000 - PINK, GREEN, BLUE & RED	54	21	5	2	7	42043.95	\N	Covered	\N	12	Consumable	HP ELASTIC 5000 - PINK, GREEN, BLUE & RED	t	f	2026-06-03 12:31:54.659427	2026-06-03 12:31:54.659436	59	\N	HOS0227
1355	3	3	MAT-00427	HP SPOT WELDER	54	21	5	2	6	17460.99	\N	Covered	\N	12	Consumable	HP SPOT WELDER	t	f	2026-06-03 12:31:54.661366	2026-06-03 12:31:54.661374	59	\N	HOS0228
1356	3	3	MAT-00428	LIGARINGS (1040) CLEAR & GREY	54	21	5	2	7	24747.81	\N	Covered	\N	12	Consumable	LIGARINGS (1040) CLEAR & GREY	t	f	2026-06-03 12:31:54.663318	2026-06-03 12:31:54.663326	59	\N	HOS0229
1357	3	3	MAT-00429	LINGUAL SHEATH HP (PKT OF 50)	54	21	5	4	11	11910.81	\N	Covered	\N	12	Consumable	LINGUAL SHEATH HP (PKT OF 50)	t	f	2026-06-03 12:31:54.665147	2026-06-03 12:31:54.665156	59	\N	HOS0230
1358	3	3	MAT-00430	NITI 014 PKT OF 25 U/L	54	21	5	4	9	19412.86	\N	Covered	\N	12	Consumable	NITI 014 PKT OF 25 U/L	t	f	2026-06-03 12:31:54.667064	2026-06-03 12:31:54.667073	59	\N	HOS0231
1359	3	3	MAT-00431	NITI 016 PKT OF 25 U/L	54	21	5	4	10	15280.31	\N	Covered	\N	12	Consumable	NITI 016 PKT OF 25 U/L	t	f	2026-06-03 12:31:54.669111	2026-06-03 12:31:54.66912	59	\N	HOS0232
1360	3	3	MAT-00432	PLIER STAND	54	21	5	4	11	39780.01	\N	Covered	\N	12	Consumable	PLIER STAND	t	f	2026-06-03 12:31:54.670955	2026-06-03 12:31:54.670965	59	\N	HOS0233
1361	3	3	MAT-00433	RELIEF WAX	54	21	5	5	18	42881.58	\N	Covered	\N	12	Consumable	RELIEF WAX	t	f	2026-06-03 12:31:54.673348	2026-06-03 12:31:54.67336	59	\N	HOS0234
1362	3	3	MAT-00434	UNIVERSAL PLIER GDC	54	21	5	2	6	36371.84	\N	Covered	\N	12	Consumable	UNIVERSAL PLIER GDC	t	f	2026-06-03 12:31:54.675653	2026-06-03 12:31:54.675662	59	\N	HOS0235
1363	3	3	MAT-00435	AVF NEEDLE 16G	54	22	5	4	16	43244.64	\N	Covered	\N	12	Consumable	AVF NEEDLE 16G	t	f	2026-06-03 12:31:54.677633	2026-06-03 12:31:54.677641	59	\N	HOS0236
1364	3	3	MAT-00436	AVF NEEDLE 17G	54	22	5	3	10	48314.91	\N	Covered	\N	12	Consumable	AVF NEEDLE 17G	t	f	2026-06-03 12:31:54.679547	2026-06-03 12:31:54.679556	59	\N	HOS0237
1365	3	3	MAT-00437	BICARB MIXER MACHINE 100 LITRES	54	22	5	3	12	13344.08	\N	Covered	\N	12	Non-Consumable	BICARB MIXER MACHINE 100 LITRES	t	f	2026-06-03 12:31:54.681421	2026-06-03 12:31:54.68143	59	\N	HOS0238
1366	3	3	MAT-00438	BICARBONATE PART B- 10LTR PACK	54	22	5	5	18	13515.59	\N	Covered	\N	12	Consumable	BICARBONATE PART B- 10LTR PACK	t	f	2026-06-03 12:31:54.683332	2026-06-03 12:31:54.68334	59	\N	HOS0239
1367	3	3	MAT-00439	CHLORITEST PAPERS FOR CHLORINE TEST	54	22	5	4	14	21108.67	\N	Covered	\N	18	Consumable	CHLORITEST PAPERS FOR CHLORINE TEST	t	f	2026-06-03 12:31:54.685373	2026-06-03 12:31:54.685382	59	\N	HOS0240
1368	3	3	MAT-00440	DIALYSATE CONNECTOR BLUE	54	22	5	4	9	49176.54	\N	Covered	\N	12	Consumable	DIALYSATE CONNECTOR BLUE	t	f	2026-06-03 12:31:54.687393	2026-06-03 12:31:54.687402	59	\N	HOS0241
1369	3	3	MAT-00441	DIALYSATE CONNECTOR RED	54	22	5	16	35	9348.73	\N	Covered	\N	12	Consumable	DIALYSATE CONNECTOR RED	t	f	2026-06-03 12:31:54.689717	2026-06-03 12:31:54.689728	59	\N	HOS0242
1370	3	3	MAT-00442	DOOR 22MM BUBBLE C.HOLDER 4008SV10 - M561711	54	22	5	4	15	29315.77	\N	Covered	\N	18	Consumable	DOOR 22MM BUBBLE C.HOLDER 4008SV10 - M561711	t	f	2026-06-03 12:31:54.692211	2026-06-03 12:31:54.692219	59	\N	HOS0243
1371	3	3	MAT-00443	DRY CITRATE PART A-40LTR/PACK	54	22	5	2	6	31257.65	\N	Covered	\N	12	Consumable	DRY CITRATE PART A-40LTR/PACK	t	f	2026-06-03 12:31:54.694202	2026-06-03 12:31:54.69421	59	\N	HOS0244
1372	3	3	MAT-00444	HIGH POTASSIUM CAN	54	22	5	5	14	45229.74	\N	Covered	\N	12	Consumable	HIGH POTASSIUM CAN	t	f	2026-06-03 12:31:54.696072	2026-06-03 12:31:54.696087	59	\N	HOS0245
1373	3	3	MAT-00445	INFORMED CONSENT FOR HAEMODIALYSIS	54	31	5	4	14	43761.04	\N	Covered	\N	18	Consumable	INFORMED CONSENT FOR HAEMODIALYSIS	t	f	2026-06-03 12:31:54.698137	2026-06-03 12:31:54.698146	59	\N	HOS0246
1374	3	3	MAT-00446	ON/OFF KIT	54	22	5	5	11	39494.21	\N	Covered	\N	12	Consumable	ON/OFF KIT	t	f	2026-06-03 12:31:54.700296	2026-06-03 12:31:54.700304	59	\N	HOS0247
1375	3	3	MAT-00447	STEPPER MOTOR WITH GEAR BOX 4-POLES *4008B/H/S *4008S V10-PART NO: M393211	54	22	5	17	55	5372.14	\N	Covered	\N	18	Non-Consumable	STEPPER MOTOR WITH GEAR BOX 4-POLES *4008B/H/S *4008S V10-PART NO: M393211	t	f	2026-06-03 12:31:54.702428	2026-06-03 12:31:54.702437	59	\N	HOS0249
1376	3	3	MAT-00448	TUBE FIXING ROLLER PUMP	54	22	5	29	78	5210.01	\N	Covered	\N	18	Non-Consumable	TUBE FIXING ROLLER PUMP	t	f	2026-06-03 12:31:54.704422	2026-06-03 12:31:54.704431	59	\N	HOS0250
1377	3	3	MAT-00449	ULTRAFILTRATION PUMP 40008B/H/S/S V10 - PART NO:6707061	54	22	5	35	126	6499.34	\N	Covered	\N	18	Non-Consumable	ULTRAFILTRATION PUMP 40008B/H/S/S V10 - PART NO:6707061	t	f	2026-06-03 12:31:54.706779	2026-06-03 12:31:54.706791	59	\N	HOS0251
1378	3	3	MAT-00450	10A FUSE - 100NOS-BOX	54	23	5	3	11	10443.43	\N	Covered	\N	18	Consumable	10A FUSE - 100NOS-BOX	t	f	2026-06-03 12:31:54.709111	2026-06-03 12:31:54.709119	59	\N	HOS0252
1379	3	3	MAT-00451	16X24 DOOR GASKET	54	23	5	2	5	31170.49	\N	Covered	\N	18	Consumable	16X24 DOOR GASKET	t	f	2026-06-03 12:31:54.711121	2026-06-03 12:31:54.711129	59	\N	HOS0253
1380	3	3	MAT-00452	24 POET POE SWITCH (DGS TO 26P)	54	23	5	4	13	37487.18	\N	Covered	\N	18	Consumable	24 POET POE SWITCH (DGS TO 26P)	t	f	2026-06-03 12:31:54.712967	2026-06-03 12:31:54.712975	59	\N	HOS0254
1381	3	3	MAT-00453	6A FUSE - 100NOS-BOX	54	23	5	5	12	33036.78	\N	Covered	\N	18	Consumable	6A FUSE - 100NOS-BOX	t	f	2026-06-03 12:31:54.714826	2026-06-03 12:31:54.714834	59	\N	HOS0255
1382	3	3	MAT-00454	ABG RADIOMETER - SBP SOLUTION PACK - 944-506	54	24	5	38	119	7501.07	\N	Covered	\N	12	Consumable	ABG RADIOMETER - SBP SOLUTION PACK - 944-506	t	f	2026-06-03 12:31:54.716739	2026-06-03 12:31:54.716748	59	\N	HOS0256
1383	3	3	MAT-00455	AEROSEPT 5LTRS - DISINFECTANT	54	28	5	4	10	10054.47	\N	Covered	\N	18	Consumable	AEROSEPT 5LTRS - DISINFECTANT	t	f	2026-06-03 12:31:54.718731	2026-06-03 12:31:54.71874	59	\N	HOS0257
1384	3	3	MAT-00456	ALL OUT MACHINE WITH REFILL	54	26	5	4	11	36519.29	\N	Covered	\N	18	Consumable	ALL OUT MACHINE WITH REFILL	t	f	2026-06-03 12:31:54.720699	2026-06-03 12:31:54.720708	59	\N	HOS0258
1459	3	3	MAT-00531	NIGHTIES	54	27	5	2	7	26397.84	\N	Covered	\N	5	Consumable	NIGHTIES	t	f	2026-06-03 12:31:54.876087	2026-06-03 12:31:54.876096	59	\N	HOS0334
1385	3	3	MAT-00457	ALL OUT MOSQUITO REPELLENT - REFILL	54	26	5	5	20	34513.15	\N	Covered	\N	18	Consumable	ALL OUT MOSQUITO REPELLENT - REFILL	t	f	2026-06-03 12:31:54.722968	2026-06-03 12:31:54.72298	59	\N	HOS0259
1386	3	3	MAT-00458	ANASTHESIA BOOKLET	54	31	5	2	8	19712.34	\N	Covered	\N	12	Consumable	ANASTHESIA BOOKLET	t	f	2026-06-03 12:31:54.725409	2026-06-03 12:31:54.725418	59	\N	HOS0260
1387	3	3	MAT-00459	AUDIOLOGICAL EVALUATION	54	31	5	4	13	33238.36	\N	Covered	\N	12	Consumable	AUDIOLOGICAL EVALUATION	t	f	2026-06-03 12:31:54.727387	2026-06-03 12:31:54.727396	59	\N	HOS0261
1388	3	3	MAT-00460	BASKET FOR MONITOR STAND	54	26	5	3	8	24369.43	\N	Covered	\N	18	Non-Consumable	BASKET FOR MONITOR STAND	t	f	2026-06-03 12:31:54.729323	2026-06-03 12:31:54.729332	59	\N	HOS0262
1389	3	3	MAT-00461	BED SIDE LOCKERS	54	26	5	2	7	43336.49	\N	Covered	\N	18	Non-Consumable	BED SIDE LOCKERS	t	f	2026-06-03 12:31:54.731302	2026-06-03 12:31:54.731311	59	\N	HOS0263
1390	3	3	MAT-00462	BENEFUSION USP_SYRINGE PUMP	54	25	5	2	5	10679.45	\N	Covered	\N	12	Non-Consumable	BENEFUSION USP_SYRINGE PUMP	t	f	2026-06-03 12:31:54.7332	2026-06-03 12:31:54.733208	59	\N	HOS0264
1391	3	3	MAT-00463	BIOCHEMISTRY REGISTER	54	31	5	5	18	34986.14	\N	Covered	\N	12	Consumable	BIOCHEMISTRY REGISTER	t	f	2026-06-03 12:31:54.735218	2026-06-03 12:31:54.735228	59	\N	HOS0265
1392	3	3	MAT-00464	BIRTH CERTIFICATE	54	31	5	5	15	42198.21	\N	Covered	\N	12	Consumable	BIRTH CERTIFICATE	t	f	2026-06-03 12:31:54.737172	2026-06-03 12:31:54.73718	59	\N	HOS0266
1393	3	3	MAT-00465	BLOOD PRESSURE MONITORING CHART	54	31	5	13	29	6877.84	\N	Covered	\N	12	Consumable	BLOOD PRESSURE MONITORING CHART	t	f	2026-06-03 12:31:54.739274	2026-06-03 12:31:54.739285	59	\N	HOS0267
1394	3	3	MAT-00466	BLUE BED SHEET	54	27	5	3	11	12899.78	\N	Covered	\N	5	Non-Consumable	BLUE BED SHEET	t	f	2026-06-03 12:31:54.741695	2026-06-03 12:31:54.741704	59	\N	HOS0268
1395	3	3	MAT-00467	BLUE COLOUR COAT	54	27	5	3	9	19537.67	\N	Covered	\N	5	Non-Consumable	BLUE COLOUR COAT	t	f	2026-06-03 12:31:54.743619	2026-06-03 12:31:54.743627	59	\N	HOS0269
1396	3	3	MAT-00468	BLUE PILLOW COVER	54	27	5	3	12	19603.12	\N	Covered	\N	5	Non-Consumable	BLUE PILLOW COVER	t	f	2026-06-03 12:31:54.745501	2026-06-03 12:31:54.74551	59	\N	HOS0270
1397	3	3	MAT-00469	BP APPARATUS - DIAMOND LED 141 BP MONITOR	54	26	5	2	8	16600.18	\N	Covered	\N	12	Non-Consumable	BP APPARATUS - DIAMOND LED 141 BP MONITOR	t	f	2026-06-03 12:31:54.747377	2026-06-03 12:31:54.747386	59	\N	HOS0271
1398	3	3	MAT-00470	BP APPARATUS - DIGITAL  - PAED	54	25	5	2	7	32194.67	\N	Covered	\N	12	Non-Consumable	BP APPARATUS - DIGITAL  - PAED	t	f	2026-06-03 12:31:54.749322	2026-06-03 12:31:54.74933	59	\N	HOS0272
1399	3	3	MAT-00471	BPL ECG 9108D Z-FOLD PAPERS (150 SHEETS)	54	25	5	4	9	15401.35	\N	Covered	\N	12	Consumable	BPL ECG 9108D Z-FOLD PAPERS (150 SHEETS)	t	f	2026-06-03 12:31:54.751344	2026-06-03 12:31:54.751354	59	\N	HOS0273
1400	3	3	MAT-00472	BPL ECG PAPERS - 50MM	54	31	5	4	11	43902.38	\N	Covered	\N	12	Consumable	BPL ECG PAPERS - 50MM	t	f	2026-06-03 12:31:54.75339	2026-06-03 12:31:54.753399	59	\N	HOS0274
1401	3	3	MAT-00473	BPL ECG PAPERS - 80MM	54	31	5	36	122	9133.01	\N	Covered	\N	12	Consumable	BPL ECG PAPERS - 80MM	t	f	2026-06-03 12:31:54.755582	2026-06-03 12:31:54.755593	59	\N	HOS0275
1402	3	3	MAT-00474	BPL FOETAL DOPPLER PROBE - MODEL: FD 9713	54	25	5	2	7	26524.84	\N	Covered	\N	12	Consumable	BPL FOETAL DOPPLER PROBE - MODEL: FD 9713	t	f	2026-06-03 12:31:54.75812	2026-06-03 12:31:54.758129	59	\N	HOS0276
1403	3	3	MAT-00475	BPL MONOPHASIC DEFIBRILLATOR MODEL-DF 2509R - PRINTER	54	25	5	4	11	29423.66	\N	Covered	\N	12	Consumable	BPL MONOPHASIC DEFIBRILLATOR MODEL-DF 2509R - PRINTER	t	f	2026-06-03 12:31:54.760195	2026-06-03 12:31:54.760203	59	\N	HOS0277
1404	3	3	MAT-00476	BREAST PUMP ACCESSORIES FOR MEDELA LACTINA	54	25	5	2	6	25335.95	\N	Covered	\N	12	Consumable	BREAST PUMP ACCESSORIES FOR MEDELA LACTINA	t	f	2026-06-03 12:31:54.762177	2026-06-03 12:31:54.762186	59	\N	HOS0278
1405	3	3	MAT-00477	BREAST PUMP SYRINGE	54	25	5	2	6	15075.48	\N	Covered	\N	12	Consumable	BREAST PUMP SYRINGE	t	f	2026-06-03 12:31:54.764114	2026-06-03 12:31:54.764123	59	\N	HOS0279
1406	3	3	MAT-00478	CARDIOLOGY INVESTIGATION FORM	54	31	5	5	11	27954.71	\N	Covered	\N	12	Consumable	CARDIOLOGY INVESTIGATION FORM	t	f	2026-06-03 12:31:54.766029	2026-06-03 12:31:54.766038	59	\N	HOS0280
1407	3	3	MAT-00479	CARTRIDGE 104 DRUM	54	31	5	5	19	26651.83	\N	Covered	\N	18	Consumable	CARTRIDGE 104 DRUM	t	f	2026-06-03 12:31:54.767949	2026-06-03 12:31:54.767958	59	\N	HOS0281
1408	3	3	MAT-00480	CARTRIDGE 110A	54	31	5	5	12	28285.67	\N	Covered	\N	18	Consumable	CARTRIDGE 110A	t	f	2026-06-03 12:31:54.769999	2026-06-03 12:31:54.770007	59	\N	HOS0282
1409	3	3	MAT-00481	CARTRIDGE 119A	54	31	5	5	14	36868.49	\N	Covered	\N	18	Consumable	CARTRIDGE 119A	t	f	2026-06-03 12:31:54.772095	2026-06-03 12:31:54.772105	59	\N	HOS0283
1410	3	3	MAT-00482	CARTRIDGE 12A	54	31	5	4	13	21745.11	\N	Covered	\N	18	Consumable	CARTRIDGE 12A	t	f	2026-06-03 12:31:54.774613	2026-06-03 12:31:54.774623	59	\N	HOS0284
1411	3	3	MAT-00483	CARTRIDGE 166A	54	31	5	2	6	16174.55	\N	Covered	\N	18	Consumable	CARTRIDGE 166A	t	f	2026-06-03 12:31:54.776692	2026-06-03 12:31:54.776701	59	\N	HOS0285
1412	3	3	MAT-00484	CARTRIDGE 673	54	31	5	4	14	13293.03	\N	Covered	\N	18	Consumable	CARTRIDGE 673	t	f	2026-06-03 12:31:54.778664	2026-06-03 12:31:54.778673	59	\N	HOS0286
1413	3	3	MAT-00485	CARTRIDGE 680A	54	31	5	4	13	44760.69	\N	Covered	\N	18	Consumable	CARTRIDGE 680A	t	f	2026-06-03 12:31:54.780543	2026-06-03 12:31:54.780552	59	\N	HOS0287
1414	3	3	MAT-00486	CARTRIDGE 88A	54	31	5	2	5	42502.66	\N	Covered	\N	18	Consumable	CARTRIDGE 88A	t	f	2026-06-03 12:31:54.782503	2026-06-03 12:31:54.782512	59	\N	HOS0288
1415	3	3	MAT-00487	CARTRIDGE B021 BROTHER	54	31	5	4	12	23429.6	\N	Covered	\N	18	Consumable	CARTRIDGE B021 BROTHER	t	f	2026-06-03 12:31:54.78443	2026-06-03 12:31:54.784439	59	\N	HOS0289
1416	3	3	MAT-00488	CARTRIDGE EPSON 664 BLACK	54	31	5	34	113	6452.19	\N	Covered	\N	18	Consumable	CARTRIDGE EPSON 664 BLACK	t	f	2026-06-03 12:31:54.786565	2026-06-03 12:31:54.786574	59	\N	HOS0290
1417	3	3	MAT-00489	CARTRIDGE EPSON 664 COLOUR	54	31	5	5	20	21978.98	\N	Covered	\N	18	Consumable	CARTRIDGE EPSON 664 COLOUR	t	f	2026-06-03 12:31:54.788611	2026-06-03 12:31:54.788621	59	\N	HOS0291
1418	3	3	MAT-00490	CH TOWEL 36*29	54	27	5	4	11	21656.31	\N	Covered	\N	5	Non-Consumable	CH TOWEL 36*29	t	f	2026-06-03 12:31:54.791102	2026-06-03 12:31:54.791114	59	\N	HOS0292
1419	3	3	MAT-00491	DIGITAL BP APPARATUS - OMRON 7143T WITH ADAPTER	54	26	5	5	11	38960.02	\N	Covered	\N	12	Non-Consumable	DIGITAL BP APPARATUS - OMRON 7143T WITH ADAPTER	t	f	2026-06-03 12:31:54.793213	2026-06-03 12:31:54.793222	59	\N	HOS0293
1420	3	3	MAT-00492	DISCHARGE SUMMARY	54	31	23	5	14	44067.66	\N	Covered	\N	12	Consumable	DISCHARGE SUMMARY	t	f	2026-06-03 12:31:54.795182	2026-06-03 12:31:54.795191	59	\N	HOS0294
1421	3	3	MAT-00493	DISPOSABLE MEAL TRAY WITH LID- WHITE - 4 COMPARTMENT- GOOD QUALITY	54	26	5	3	12	16730.97	\N	Covered	\N	18	Consumable	DISPOSABLE MEAL TRAY WITH LID- WHITE - 4 COMPARTMENT- GOOD QUALITY	t	f	2026-06-03 12:31:54.797098	2026-06-03 12:31:54.797106	59	\N	HOS0295
1460	3	3	MAT-00532	NOTE PAD	54	31	5	2	6	35670.68	\N	Covered	\N	12	Consumable	NOTE PAD	t	f	2026-06-03 12:31:54.878139	2026-06-03 12:31:54.878148	59	\N	HOS0335
1422	3	3	MAT-00494	DOCTORS PROGRESS NOTES	54	31	23	33	78	7564.85	\N	Covered	\N	12	Consumable	DOCTORS PROGRESS NOTES	t	f	2026-06-03 12:31:54.798923	2026-06-03 12:31:54.798931	59	\N	HOS0296
1423	3	3	MAT-00495	DOCUMENTATION REGISTER	54	31	5	3	10	49645.2	\N	Covered	\N	12	Consumable	DOCUMENTATION REGISTER	t	f	2026-06-03 12:31:54.800887	2026-06-03 12:31:54.800896	59	\N	HOS0297
1424	3	3	MAT-00496	DOOR MAT (LEATHER)	54	26	5	3	7	48209.25	\N	Covered	\N	12	Consumable	DOOR MAT (LEATHER)	t	f	2026-06-03 12:31:54.803033	2026-06-03 12:31:54.803042	59	\N	HOS0298
1425	3	3	MAT-00497	DUSTER	54	31	5	46	95	5570.75	\N	Covered	\N	5	Consumable	DUSTER	t	f	2026-06-03 12:31:54.804972	2026-06-03 12:31:54.804981	59	\N	HOS0299
1426	3	3	MAT-00498	ECG PAPER - 005 - BPL - 9108D	54	31	12	5	19	22543.07	\N	Covered	\N	12	Consumable	ECG PAPER - 005 - BPL - 9108D	t	f	2026-06-03 12:31:54.807478	2026-06-03 12:31:54.80749	59	\N	HOS0300
1427	3	3	MAT-00499	ECG ROLL PAPER - VESTA 12EC RMS 210MMX20MTR	54	31	12	5	12	43078.65	\N	Covered	\N	12	Consumable	ECG ROLL PAPER - VESTA 12EC RMS 210MMX20MTR	t	f	2026-06-03 12:31:54.809594	2026-06-03 12:31:54.809603	59	\N	HOS0301
1428	3	3	MAT-00500	FOOT STEP DOUBLE SS	54	26	5	5	14	47702.7	\N	Covered	\N	18	Non-Consumable	FOOT STEP DOUBLE SS	t	f	2026-06-03 12:31:54.811517	2026-06-03 12:31:54.811526	59	\N	HOS0302
1429	3	3	MAT-00501	GOGGLES - 3M QUALITY	54	26	5	49	186	5185.2	\N	Covered	\N	18	Consumable	GOGGLES - 3M QUALITY	t	f	2026-06-03 12:31:54.813467	2026-06-03 12:31:54.813475	59	\N	HOS0303
1430	3	3	MAT-00502	GRAPHIC TPR CHART	54	31	23	2	7	49220.41	\N	Covered	\N	12	Consumable	GRAPHIC TPR CHART	t	f	2026-06-03 12:31:54.815392	2026-06-03 12:31:54.8154	59	\N	HOS0304
1431	3	3	MAT-00503	HISTOPATHOLOGY REQUEST FORM	54	31	23	5	14	38844.37	\N	Covered	\N	12	Consumable	HISTOPATHOLOGY REQUEST FORM	t	f	2026-06-03 12:31:54.81736	2026-06-03 12:31:54.817368	59	\N	HOS0305
1432	3	3	MAT-00504	HISTORY AND PHYSICAL EXAMINATION	54	31	23	3	8	16938.78	\N	Covered	\N	12	Consumable	HISTORY AND PHYSICAL EXAMINATION	t	f	2026-06-03 12:31:54.81937	2026-06-03 12:31:54.819379	59	\N	HOS0306
1433	3	3	MAT-00505	ICU HIGH RISK/GRAVE RISK CONSENT FORM	54	31	23	3	9	13437.27	\N	Covered	\N	12	Consumable	ICU HIGH RISK/GRAVE RISK CONSENT FORM	t	f	2026-06-03 12:31:54.821333	2026-06-03 12:31:54.821342	59	\N	HOS0307
1434	3	3	MAT-00506	ICU OBSERVATION CHART	54	31	23	2	6	49233.46	\N	Covered	\N	12	Consumable	ICU OBSERVATION CHART	t	f	2026-06-03 12:31:54.823611	2026-06-03 12:31:54.823622	59	\N	HOS0308
1435	3	3	MAT-00507	INCH TAPE	54	26	5	4	16	22518.31	\N	Covered	\N	18	Non-Consumable	INCH TAPE	t	f	2026-06-03 12:31:54.82594	2026-06-03 12:31:54.825948	59	\N	HOS0309
1436	3	3	MAT-00508	INDUCTION STOVE - PIGEON PRIME	54	26	5	2	6	28615.93	\N	Covered	\N	18	Non-Consumable	INDUCTION STOVE - PIGEON PRIME	t	f	2026-06-03 12:31:54.827894	2026-06-03 12:31:54.827902	59	\N	HOS0310
1437	3	3	MAT-00509	INFORMED CONSENT FOR ANASTHESIA / SEDATION	54	31	23	2	5	25025.39	\N	Covered	\N	12	Consumable	INFORMED CONSENT FOR ANASTHESIA / SEDATION	t	f	2026-06-03 12:31:54.82985	2026-06-03 12:31:54.829858	59	\N	HOS0311
1438	3	3	MAT-00510	INFORMED CONSENT FOR SURGERY	54	31	23	3	10	10456.88	\N	Covered	\N	12	Consumable	INFORMED CONSENT FOR SURGERY	t	f	2026-06-03 12:31:54.831783	2026-06-03 12:31:54.831792	59	\N	HOS0312
1439	3	3	MAT-00511	INITIAL RAPID ASSESSMENT CHART	54	31	23	4	16	42966	\N	Covered	\N	12	Consumable	INITIAL RAPID ASSESSMENT CHART	t	f	2026-06-03 12:31:54.833669	2026-06-03 12:31:54.833678	59	\N	HOS0313
1440	3	3	MAT-00512	INTAKE AND OUTPUT RECORD	54	31	23	4	16	17429.78	\N	Covered	\N	12	Consumable	INTAKE AND OUTPUT RECORD	t	f	2026-06-03 12:31:54.835807	2026-06-03 12:31:54.835816	59	\N	HOS0314
1441	3	3	MAT-00513	INVESTIGATION CHART	54	31	23	2	8	47048.89	\N	Covered	\N	12	Consumable	INVESTIGATION CHART	t	f	2026-06-03 12:31:54.837725	2026-06-03 12:31:54.837733	59	\N	HOS0315
1442	3	3	MAT-00514	IP REGISTER	54	31	5	4	13	38589.18	\N	Covered	\N	12	Consumable	IP REGISTER	t	f	2026-06-03 12:31:54.840061	2026-06-03 12:31:54.840072	59	\N	HOS0316
1443	3	3	MAT-00515	IRON STOOL	54	26	5	2	6	24460.58	\N	Covered	\N	18	Non-Consumable	IRON STOOL	t	f	2026-06-03 12:31:54.84248	2026-06-03 12:31:54.842489	59	\N	HOS0317
1444	3	3	MAT-00516	ISSUE AND MASTER REGISTER FOR BLOOD BANK	54	31	5	2	7	27473.18	\N	Covered	\N	12	Consumable	ISSUE AND MASTER REGISTER FOR BLOOD BANK	t	f	2026-06-03 12:31:54.844475	2026-06-03 12:31:54.844483	59	\N	HOS0318
1445	3	3	MAT-00517	ISSUE REGISTER	54	31	5	2	8	26925.95	\N	Covered	\N	12	Consumable	ISSUE REGISTER	t	f	2026-06-03 12:31:54.846455	2026-06-03 12:31:54.846464	59	\N	HOS0319
1446	3	3	MAT-00518	KORA CLOTH IN MTRS	54	27	24	4	11	17989.92	\N	Covered	\N	5	Non-Consumable	KORA CLOTH IN MTRS	t	f	2026-06-03 12:31:54.848403	2026-06-03 12:31:54.848411	59	\N	HOS0320
1447	3	3	MAT-00519	LARYNGOSCOPE BULB	54	18	5	2	5	20534.86	\N	Covered	\N	12	Non-Consumable	LARYNGOSCOPE BULB	t	f	2026-06-03 12:31:54.850372	2026-06-03 12:31:54.850381	59	\N	HOS0321
1448	3	3	MAT-00520	LARYNGOSCOPE SET WITH MC COY BLADE (SIZE1,2,3 & 4)	54	26	5	3	10	46934.57	\N	Covered	\N	12	Non-Consumable	LARYNGOSCOPE SET WITH MC COY BLADE (SIZE1,2,3 & 4)	t	f	2026-06-03 12:31:54.852583	2026-06-03 12:31:54.852593	59	\N	HOS0322
1449	3	3	MAT-00521	LAUNDRY BAG WITH STEEL RAILING & WHEELS OVER ALL SIZE 22.5” ROUND X 30” HEIGHT	54	25	5	5	14	17148.26	\N	Covered	\N	18	Non-Consumable	LAUNDRY BAG WITH STEEL RAILING & WHEELS OVER ALL SIZE 22.5” ROUND X 30” HEIGHT	t	f	2026-06-03 12:31:54.854574	2026-06-03 12:31:54.854583	59	\N	HOS0323
1450	3	3	MAT-00522	CL LEAVE APPLICATION BOOK	54	31	23	22	51	9730.39	\N	Covered	\N	12	Consumable	CL LEAVE APPLICATION BOOK	t	f	2026-06-03 12:31:54.856913	2026-06-03 12:31:54.856925	59	\N	HOS0324
1451	3	3	MAT-00523	MAKINTOSH SHEETS - IN MTRS	54	26	24	3	7	10235.77	\N	Covered	\N	12	Non-Consumable	MAKINTOSH SHEETS - IN MTRS	t	f	2026-06-03 12:31:54.85934	2026-06-03 12:31:54.859349	59	\N	HOS0325
1452	3	3	MAT-00524	MATTRESS - 40 DENSITY MAGIC PVC REXINE-SINGLE SECTION MATRESS - SIZE 72X30X4 INCHES	54	26	5	4	16	48249.72	\N	Covered	\N	18	Non-Consumable	MATTRESS - 40 DENSITY MAGIC PVC REXINE-SINGLE SECTION MATRESS - SIZE 72X30X4 INCHES	t	f	2026-06-03 12:31:54.861384	2026-06-03 12:31:54.861393	59	\N	HOS0326
1453	3	3	MAT-00525	MEDICAL CERTIFICATE	54	31	23	3	10	39458.66	\N	Covered	\N	12	Consumable	MEDICAL CERTIFICATE	t	f	2026-06-03 12:31:54.863359	2026-06-03 12:31:54.863368	59	\N	HOS0327
1454	3	3	MAT-00526	MEDICATION SHEET	54	31	23	3	11	25564.93	\N	Covered	\N	12	Consumable	MEDICATION SHEET	t	f	2026-06-03 12:31:54.865302	2026-06-03 12:31:54.86531	59	\N	HOS0328
1455	3	3	MAT-00527	MG CHARITABLE TRUST PAYMENT VOUCHER	54	31	23	2	5	17666.38	\N	Covered	\N	12	Consumable	MG CHARITABLE TRUST PAYMENT VOUCHER	t	f	2026-06-03 12:31:54.867242	2026-06-03 12:31:54.867251	59	\N	HOS0329
1456	3	3	MAT-00528	MOBILE PHONE SAMSUNG	54	26	5	3	9	34424.32	\N	Covered	\N	18	Non-Consumable	MOBILE PHONE SAMSUNG	t	f	2026-06-03 12:31:54.869407	2026-06-03 12:31:54.869417	59	\N	HOS0331
1457	3	3	MAT-00529	MYCOLOGY REGISTER	54	31	5	2	5	31597.08	\N	Covered	\N	12	Consumable	MYCOLOGY REGISTER	t	f	2026-06-03 12:31:54.871403	2026-06-03 12:31:54.871412	59	\N	HOS0332
1458	3	3	MAT-00530	NEONATE AMBU BAG	54	26	5	5	17	21296.51	\N	Covered	\N	12	Non-Consumable	NEONATE AMBU BAG	t	f	2026-06-03 12:31:54.873741	2026-06-03 12:31:54.873754	59	\N	HOS0333
1461	3	3	MAT-00533	NURSES DAILY RECORD	54	31	23	3	10	22728.77	\N	Covered	\N	18	Consumable	NURSES DAILY RECORD	t	f	2026-06-03 12:31:54.880072	2026-06-03 12:31:54.880087	59	\N	HOS0336
1462	3	3	MAT-00534	NURSES ICU MONITORING CHART	54	31	23	3	12	34737.12	\N	Covered	\N	18	Consumable	NURSES ICU MONITORING CHART	t	f	2026-06-03 12:31:54.882026	2026-06-03 12:31:54.882035	59	\N	HOS0337
1463	3	3	MAT-00535	NURSES TREATMENT CHART	54	31	23	3	11	41501.48	\N	Covered	\N	18	Consumable	NURSES TREATMENT CHART	t	f	2026-06-03 12:31:54.883953	2026-06-03 12:31:54.883962	59	\N	HOS0338
1464	3	3	MAT-00536	NURSING ASSESMENT	54	31	23	2	5	17119.6	\N	Covered	\N	18	Consumable	NURSING ASSESMENT	t	f	2026-06-03 12:31:54.886134	2026-06-03 12:31:54.886143	59	\N	HOS0339
1465	3	3	MAT-00537	ODONIL - LAVENDER	54	26	5	5	17	17947.27	\N	Covered	\N	18	Consumable	ODONIL - LAVENDER	t	f	2026-06-03 12:31:54.88812	2026-06-03 12:31:54.888129	59	\N	HOS0340
1466	3	3	MAT-00538	OPD REGISTER	54	31	5	2	7	40240.52	\N	Covered	\N	18	Consumable	OPD REGISTER	t	f	2026-06-03 12:31:54.890439	2026-06-03 12:31:54.890451	59	\N	HOS0341
1467	3	3	MAT-00539	OPERATION RECORD 1&2	54	31	23	20	52	8957.14	\N	Covered	\N	18	Consumable	OPERATION RECORD 1&2	t	f	2026-06-03 12:31:54.892828	2026-06-03 12:31:54.892837	59	\N	HOS0342
1468	3	3	MAT-00540	OT LIST	54	31	23	4	16	32877.85	\N	Covered	\N	18	Consumable	OT LIST	t	f	2026-06-03 12:31:54.894844	2026-06-03 12:31:54.894853	59	\N	HOS0343
1469	3	3	MAT-00541	OT REGISTER	54	31	5	2	7	38475.64	\N	Covered	\N	18	Consumable	OT REGISTER	t	f	2026-06-03 12:31:54.896779	2026-06-03 12:31:54.896788	59	\N	HOS0344
1470	3	3	MAT-00542	OUT PATIENT CASE RECORD	54	31	23	4	15	11546.26	\N	Covered	\N	18	Consumable	OUT PATIENT CASE RECORD	t	f	2026-06-03 12:31:54.89872	2026-06-03 12:31:54.898728	59	\N	HOS0345
1471	3	3	MAT-00543	PACKAGE SERVICES BOOK	54	31	23	4	12	39701.13	\N	Covered	\N	18	Consumable	PACKAGE SERVICES BOOK	t	f	2026-06-03 12:31:54.900634	2026-06-03 12:31:54.900643	59	\N	HOS0346
1472	3	3	MAT-00544	PAEDIATRICS NEW BORN SHEET	54	31	13	2	6	29440.22	\N	Covered	\N	18	Consumable	PAEDIATRICS NEW BORN SHEET	t	f	2026-06-03 12:31:54.90283	2026-06-03 12:31:54.902839	59	\N	HOS0347
1473	3	3	MAT-00545	PAPER CLIPS	54	31	22	4	12	11182.73	\N	Covered	\N	18	Consumable	PAPER CLIPS	t	f	2026-06-03 12:31:54.904885	2026-06-03 12:31:54.904894	59	\N	HOS0348
1474	3	3	MAT-00546	PAPER PLATE 12 INCHES	54	26	22	2	5	15182.76	\N	Covered	\N	12	Consumable	PAPER PLATE 12 INCHES	t	f	2026-06-03 12:31:54.907256	2026-06-03 12:31:54.907272	59	\N	HOS0349
1475	3	3	MAT-00547	PAPER PLATE 6NO	54	26	22	4	15	16299.26	\N	Covered	\N	12	Consumable	PAPER PLATE 6NO	t	f	2026-06-03 12:31:54.909644	2026-06-03 12:31:54.909653	59	\N	HOS0350
1476	3	3	MAT-00548	PATIENT INVESTIGATION LOG	54	31	23	4	14	11998.62	\N	Covered	\N	18	Consumable	PATIENT INVESTIGATION LOG	t	f	2026-06-03 12:31:54.91166	2026-06-03 12:31:54.911669	59	\N	HOS0351
1477	3	3	MAT-00549	PEDIATRIC AMBU BAG	54	26	5	3	7	37608.66	\N	Covered	\N	12	Non-Consumable	PEDIATRIC AMBU BAG	t	f	2026-06-03 12:31:54.913628	2026-06-03 12:31:54.913637	59	\N	HOS0352
1478	3	3	MAT-00550	PERIPHERAL IV CENTRAL LINE	54	31	23	2	8	44902.73	\N	Covered	\N	18	Consumable	PERIPHERAL IV CENTRAL LINE	t	f	2026-06-03 12:31:54.915523	2026-06-03 12:31:54.915531	59	\N	HOS0353
1479	3	3	MAT-00551	PHARMACY INDENT BOOK	54	31	23	5	13	44018.45	\N	Covered	\N	18	Consumable	PHARMACY INDENT BOOK	t	f	2026-06-03 12:31:54.917406	2026-06-03 12:31:54.917414	59	\N	HOS0354
1480	3	3	MAT-00552	PHARMACY RETURN BOOK	54	31	23	5	14	13659.49	\N	Covered	\N	18	Consumable	PHARMACY RETURN BOOK	t	f	2026-06-03 12:31:54.91955	2026-06-03 12:31:54.919559	59	\N	HOS0355
1481	3	3	MAT-00553	PHYSICAL FITNESS CRTIFICATE	54	31	23	2	8	32654.96	\N	Covered	\N	18	Consumable	PHYSICAL FITNESS CRTIFICATE	t	f	2026-06-03 12:31:54.921705	2026-06-03 12:31:54.921714	59	\N	HOS0356
1482	3	3	MAT-00554	PILLOW	54	27	5	2	5	35389.67	\N	Covered	\N	12	Non-Consumable	PILLOW	t	f	2026-06-03 12:31:54.924176	2026-06-03 12:31:54.924188	59	\N	HOS0357
1483	3	3	MAT-00555	PLASTIC SPOON	54	26	22	2	5	25797.52	\N	Covered	\N	18	Consumable	PLASTIC SPOON	t	f	2026-06-03 12:31:54.92649	2026-06-03 12:31:54.926499	59	\N	HOS0358
1484	3	3	MAT-00556	PLASTIC TRAY	54	26	5	4	10	30679.31	\N	Covered	\N	18	Non-Consumable	PLASTIC TRAY	t	f	2026-06-03 12:31:54.92847	2026-06-03 12:31:54.928478	59	\N	HOS0359
1485	3	3	MAT-00557	PLATELET SDP ISSUE REGISTER	54	31	5	2	6	34642.99	\N	Covered	\N	18	Consumable	PLATELET SDP ISSUE REGISTER	t	f	2026-06-03 12:31:54.930434	2026-06-03 12:31:54.930443	59	\N	HOS0360
1486	3	3	MAT-00558	POLICE INTIMATION BOOK	54	31	23	5	11	32810.54	\N	Covered	\N	18	Consumable	POLICE INTIMATION BOOK	t	f	2026-06-03 12:31:54.932386	2026-06-03 12:31:54.932394	59	\N	HOS0361
1487	3	3	MAT-00559	PP FILE - A4 LARGE FILE (9.5X12.5 INCHES) WITH 9MM SPINE -PP 0.32MM WITH MATT FINISH WITH DELUXE CLIP (SAME AS SANCHETI SAMPLE) OBG	54	31	5	4	14	37317.79	\N	Covered	\N	18	Consumable	PP FILE - A4 LARGE FILE (9.5X12.5 INCHES) WITH 9MM SPINE -PP 0.32MM WITH MATT FINISH WITH DELUXE CLIP (SAME AS SANCHETI SAMPLE) OBG	t	f	2026-06-03 12:31:54.934339	2026-06-03 12:31:54.934347	59	\N	HOS0362
1488	3	3	MAT-00560	PRE ANASTHETIC CHECKUP FORM	54	31	23	28	62	9946.09	\N	Covered	\N	18	Consumable	PRE ANASTHETIC CHECKUP FORM	t	f	2026-06-03 12:31:54.936427	2026-06-03 12:31:54.936436	59	\N	HOS0363
1489	3	3	MAT-00561	PRESCRIPTION PAD	54	31	23	3	9	26966.04	\N	Covered	\N	18	Consumable	PRESCRIPTION PAD	t	f	2026-06-03 12:31:54.938414	2026-06-03 12:31:54.938423	59	\N	HOS0364
1490	3	3	MAT-00562	PRESSURE ULCER CARE	54	31	23	5	17	13396.13	\N	Covered	\N	18	Consumable	PRESSURE ULCER CARE	t	f	2026-06-03 12:31:54.940813	2026-06-03 12:31:54.940825	59	\N	HOS0365
1491	3	3	MAT-00563	PRESSURE ULCER SURVELLIANCE CARE BUNDLE	54	31	23	2	6	49872.02	\N	Covered	\N	18	Consumable	PRESSURE ULCER SURVELLIANCE CARE BUNDLE	t	f	2026-06-03 12:31:54.943177	2026-06-03 12:31:54.943185	59	\N	HOS0366
1492	3	3	MAT-00564	PULSE OXIMETER (BUY 1 GET 1 FREE OFFER)	54	26	5	4	13	11790.43	\N	Covered	\N	12	Non-Consumable	PULSE OXIMETER (BUY 1 GET 1 FREE OFFER)	t	f	2026-06-03 12:31:54.945192	2026-06-03 12:31:54.9452	59	\N	HOS0367
1493	3	3	MAT-00565	RADIOMETER - ABG - SENSOR CASSETTE FOR ABL9 300TEST PACK - SC9 - 2-BGEL	54	24	5	2	7	49317.14	\N	Covered	\N	12	Consumable	RADIOMETER - ABG - SENSOR CASSETTE FOR ABL9 300TEST PACK - SC9 - 2-BGEL	t	f	2026-06-03 12:31:54.947149	2026-06-03 12:31:54.947157	59	\N	HOS0368
1494	3	3	MAT-00566	RADIOMETER AQT90FLEX REAGENERALT PACK (200TESTS)	54	24	5	3	10	49042.32	\N	Covered	\N	12	Consumable	RADIOMETER AQT90FLEX REAGENERALT PACK (200TESTS)	t	f	2026-06-03 12:31:54.949047	2026-06-03 12:31:54.949056	59	\N	HOS0369
1495	3	3	MAT-00567	RECHARGEABLE TORCH - EVEREADY	54	26	5	4	15	45240.53	\N	Covered	\N	18	Non-Consumable	RECHARGEABLE TORCH - EVEREADY	t	f	2026-06-03 12:31:54.950977	2026-06-03 12:31:54.950988	59	\N	HOS0370
1496	3	3	MAT-00568	REQUEST FOR BLOOD AND BLOOD COMPONENTS	54	31	23	30	110	7893.55	\N	Covered	\N	12	Consumable	REQUEST FOR BLOOD AND BLOOD COMPONENTS	t	f	2026-06-03 12:31:54.953128	2026-06-03 12:31:54.953136	59	\N	HOS0371
1497	3	3	MAT-00569	SAMSUNG-32 INCHES SMART TV HD READY WITH OTT APPS MODEL-T4580	54	23	5	4	10	25272.79	\N	Covered	\N	18	Non-Consumable	SAMSUNG-32 INCHES SMART TV HD READY WITH OTT APPS MODEL-T4580	t	f	2026-06-03 12:31:54.955148	2026-06-03 12:31:54.955156	59	\N	HOS0372
1498	3	3	MAT-00570	SAMSUNG-43 INCHES SMART TV ULTRA HD 4K WITH OTT APPS MODEL-HG43BU800	54	23	5	2	6	19114.19	\N	Covered	\N	18	Non-Consumable	SAMSUNG-43 INCHES SMART TV ULTRA HD 4K WITH OTT APPS MODEL-HG43BU800	t	f	2026-06-03 12:31:54.957592	2026-06-03 12:31:54.957604	59	\N	HOS0373
1499	3	3	MAT-00571	SCISSOR 128MM	54	31	5	4	9	47096.75	\N	Covered	\N	12	Non-Consumable	SCISSOR 128MM	t	f	2026-06-03 12:31:54.95994	2026-06-03 12:31:54.959949	59	\N	HOS0374
1500	3	3	MAT-00572	SLIPPERS	54	26	27	3	10	19661.93	\N	Covered	\N	5	Consumable	SLIPPERS	t	f	2026-06-03 12:31:54.964044	2026-06-03 12:31:54.964053	59	\N	HOS0375
1501	3	3	MAT-00573	SMALL NOTE BOOK	54	31	5	35	87	6299.65	\N	Covered	\N	12	Consumable	SMALL NOTE BOOK	t	f	2026-06-03 12:31:54.965128	2026-06-03 12:31:54.965136	59	\N	HOS0376
1502	3	3	MAT-00574	SONY THERMAL PAPERS - 84S IN BOXES	54	31	5	4	12	21970.9	\N	Covered	\N	18	Consumable	SONY THERMAL PAPERS - 84S IN BOXES	t	f	2026-06-03 12:31:54.967091	2026-06-03 12:31:54.9671	59	\N	HOS0377
1503	3	3	MAT-00575	SRIPADHA PHARMACY PAYMENT VOUCHER	54	31	23	3	11	10000.59	\N	Covered	\N	12	Consumable	SRIPADHA PHARMACY PAYMENT VOUCHER	t	f	2026-06-03 12:31:54.969184	2026-06-03 12:31:54.969194	59	\N	HOS0378
1504	3	3	MAT-00576	STEEL PLATE ROUND	54	26	5	4	10	29828.37	\N	Covered	\N	18	Non-Consumable	STEEL PLATE ROUND	t	f	2026-06-03 12:31:54.971274	2026-06-03 12:31:54.971282	59	\N	HOS0379
1505	3	3	MAT-00577	STEEL TEA CUP	54	26	5	3	8	34638.79	\N	Covered	\N	18	Non-Consumable	STEEL TEA CUP	t	f	2026-06-03 12:31:54.973719	2026-06-03 12:31:54.97373	59	\N	HOS0380
1506	3	3	MAT-00578	SURGICAL SITE INFECTION PREVENTION CHECKLIST	54	31	23	2	5	41898.03	\N	Covered	\N	12	Consumable	SURGICAL SITE INFECTION PREVENTION CHECKLIST	t	f	2026-06-03 12:31:54.976161	2026-06-03 12:31:54.97617	59	\N	HOS0381
1507	3	3	MAT-00579	THERMAL PRINTER PAPER ROLL FOR AQT90-RADIOMETER 112MM (20MTRS)	54	31	5	4	13	38080.11	\N	Covered	\N	18	Consumable	THERMAL PRINTER PAPER ROLL FOR AQT90-RADIOMETER 112MM (20MTRS)	t	f	2026-06-03 12:31:54.978192	2026-06-03 12:31:54.978201	59	\N	HOS0382
1508	3	3	MAT-00580	THERMAL PRINTER ROLLS FOR ABG - 80MM 20 MTRS	54	31	5	4	9	20324.55	\N	Covered	\N	18	Consumable	THERMAL PRINTER ROLLS FOR ABG - 80MM 20 MTRS	t	f	2026-06-03 12:31:54.980351	2026-06-03 12:31:54.98036	59	\N	HOS0383
1509	3	3	MAT-00581	THERMOSCAN - ROSSMAX	54	26	5	3	12	30771.34	\N	Covered	\N	12	Consumable	THERMOSCAN - ROSSMAX	t	f	2026-06-03 12:31:54.982379	2026-06-03 12:31:54.982388	59	\N	HOS0384
1510	3	3	MAT-00582	THICK PLASTIC SHEET BIG ROLLS	54	26	6	4	13	43134.08	\N	Covered	\N	18	Consumable	THICK PLASTIC SHEET BIG ROLLS	t	f	2026-06-03 12:31:54.984355	2026-06-03 12:31:54.984364	59	\N	HOS0385
1511	3	3	MAT-00583	TOURNIQUET LARGE SIZE - TYNOR	54	26	5	3	9	10124.09	\N	Covered	\N	12	Non-Consumable	TOURNIQUET LARGE SIZE - TYNOR	t	f	2026-06-03 12:31:54.986501	2026-06-03 12:31:54.98651	59	\N	HOS0386
1512	3	3	MAT-00584	TOURNIQUET MEDIUM SIZE - TYNOR	54	26	5	4	10	29620.3	\N	Covered	\N	12	Non-Consumable	TOURNIQUET MEDIUM SIZE - TYNOR	t	f	2026-06-03 12:31:54.988524	2026-06-03 12:31:54.988532	59	\N	HOS0387
1513	3	3	MAT-00585	TOURNIQUET SMALL SIZE - TYNOR	54	26	5	5	14	35675.08	\N	Covered	\N	12	Non-Consumable	TOURNIQUET SMALL SIZE - TYNOR	t	f	2026-06-03 12:31:54.990826	2026-06-03 12:31:54.990838	59	\N	HOS0388
1514	3	3	MAT-00586	TYNOR - RESTRAINER I-65 UN-	54	26	5	3	8	33549.49	\N	Covered	\N	12	Non-Consumable	TYNOR - RESTRAINER I-65 UN-	t	f	2026-06-03 12:31:54.993255	2026-06-03 12:31:54.993264	59	\N	HOS0389
1515	3	3	MAT-00587	URINARY CATHETER CARE	54	31	23	5	17	16270.52	\N	Covered	\N	12	Consumable	URINARY CATHETER CARE	t	f	2026-06-03 12:31:54.995268	2026-06-03 12:31:54.995277	59	\N	HOS0390
1516	3	3	MAT-00588	VACCINATION CARD (PAEDIATRIC)	54	31	5	28	95	6453.22	\N	Covered	\N	12	Consumable	VACCINATION CARD (PAEDIATRIC)	t	f	2026-06-03 12:31:54.997219	2026-06-03 12:31:54.997228	59	\N	HOS0391
1517	3	3	MAT-00589	VAP CARE BUNDLE	54	31	23	2	5	33634.67	\N	Covered	\N	12	Consumable	VAP CARE BUNDLE	t	f	2026-06-03 12:31:54.999171	2026-06-03 12:31:54.999179	59	\N	HOS0392
1518	3	3	MAT-00590	VIM BAR - SMALL	54	26	5	3	8	18525.4	\N	Covered	\N	18	Consumable	VIM BAR - SMALL	t	f	2026-06-03 12:31:55.001066	2026-06-03 12:31:55.001075	59	\N	HOS0393
1519	3	3	MAT-00591	WALKER FOLDABLE SUPERIOR QUALITY	54	26	5	5	15	30872.71	\N	Covered	\N	12	Non-Consumable	WALKER FOLDABLE SUPERIOR QUALITY	t	f	2026-06-03 12:31:55.003205	2026-06-03 12:31:55.003213	59	\N	HOS0394
1520	3	3	MAT-00592	WALL CLOCK ROUND - AJANTA	54	26	5	3	7	44917.82	\N	Covered	\N	18	Non-Consumable	WALL CLOCK ROUND - AJANTA	t	f	2026-06-03 12:31:55.005223	2026-06-03 12:31:55.005232	59	\N	HOS0395
1521	3	3	MAT-00593	WARD CENSUS REGISTER	54	31	5	5	16	42515.36	\N	Covered	\N	12	Consumable	WARD CENSUS REGISTER	t	f	2026-06-03 12:31:55.007456	2026-06-03 12:31:55.007468	59	\N	HOS0396
1522	3	3	MAT-00594	WELCOME KIT IN ZIPLOCK POUCH WITH LOGO PRINT-20GM SOAP, 20ML KIWI SHAMPOO, 20ML KIWI BODY LOTION, WHITE BRUSH, COLGATE PASTE	54	26	13	5	17	25224.08	\N	Covered	\N	18	Consumable	WELCOME KIT IN ZIPLOCK POUCH WITH LOGO PRINT-20GM SOAP, 20ML KIWI SHAMPOO, 20ML KIWI BODY LOTION, WHITE BRUSH, COLGATE PASTE	t	f	2026-06-03 12:31:55.009733	2026-06-03 12:31:55.009742	59	\N	HOS0397
1523	3	3	MAT-00595	WHITE BOARD SIZE 4X2	54	26	5	2	5	35445.94	\N	Covered	\N	18	Non-Consumable	WHITE BOARD SIZE 4X2	t	f	2026-06-03 12:31:55.011768	2026-06-03 12:31:55.011777	59	\N	HOS0398
1524	3	3	MAT-00596	YELLOW PRESCRIPTION PAD	54	31	23	2	8	16201.47	\N	Covered	\N	12	Consumable	YELLOW PRESCRIPTION PAD	t	f	2026-06-03 12:31:55.013819	2026-06-03 12:31:55.013828	59	\N	HOS0399
1525	3	3	MAT-00597	65" SAMSUNG INTERACTIVE DISPLAY-WA65C - DESIGNED FOR THE CLASSROOM OF THE FUTURE ANDROID 11 OS* BASED PRODUCT- PROVIDES INTUITIVE USABILITY TO TEACHERS, SIMULTANEOUSLY CAN SHARE UP TO 9 SCRNS FOR MAX PRODUCTIVITY	53	16	5	2	7	12643.71	\N	Covered	\N	18	Non-Consumable	65" SAMSUNG INTERACTIVE DISPLAY-WA65C - DESIGNED FOR THE CLASSROOM OF THE FUTURE ANDROID 11 OS* BASED PRODUCT- PROVIDES INTUITIVE USABILITY TO TEACHERS, SIMULTANEOUSLY CAN SHARE UP TO 9 SCRNS FOR MAX PRODUCTIVITY	t	f	2026-06-03 12:31:55.015792	2026-06-03 12:31:55.015801	59	\N	HEQ0001
1526	3	3	MAT-00598	6U 500 RACK	53	17	5	5	11	45620.69	\N	Covered	\N	18	Non-Consumable	6U 500 RACK	t	f	2026-06-03 12:31:55.017733	2026-06-03 12:31:55.017742	59	\N	HEQ0002
1527	3	3	MAT-00599	AMBU BAG ADULT - SILICON	53	15	5	2	7	34187.77	\N	Covered	\N	12	Non-Consumable	AMBU BAG ADULT - SILICON	t	f	2026-06-03 12:31:55.019896	2026-06-03 12:31:55.019908	59	\N	HEQ0003
1528	3	3	MAT-00600	FINGER PULSE OXIMETER	53	15	5	3	8	47158.81	\N	Covered	\N	12	Non-Consumable	FINGER PULSE OXIMETER	t	f	2026-06-03 12:31:55.021824	2026-06-03 12:31:55.021833	59	\N	HEQ0004
1529	3	3	MAT-00601	FLUID WARMER CABINET- CAPACITY 40 BOTTLES - APOLLO MAKE - INNER CHAMBER SS WITH GLASS DOOR, DIGITAL TEMP INDICATOR, REMOVABLE SHELVES	53	15	5	4	13	46260.38	\N	Covered	\N	12	Non-Consumable	FLUID WARMER CABINET- CAPACITY 40 BOTTLES - APOLLO MAKE - INNER CHAMBER SS WITH GLASS DOOR, DIGITAL TEMP INDICATOR, REMOVABLE SHELVES	t	f	2026-06-03 12:31:55.024557	2026-06-03 12:31:55.024569	59	\N	HEQ0005
1530	3	3	MAT-00602	FORMALIN CHAMBER WITH ALL STANDARD ACCESSORIES	53	15	5	5	17	29501	\N	Covered	\N	12	Non-Consumable	FORMALIN CHAMBER WITH ALL STANDARD ACCESSORIES	t	f	2026-06-03 12:31:55.026898	2026-06-03 12:31:55.026906	59	\N	HEQ0006
1531	3	3	MAT-00603	FREERS ELEVATOR	53	15	5	36	139	7886.86	\N	Covered	\N	12	Non-Consumable	FREERS ELEVATOR	t	f	2026-06-03 12:31:55.028872	2026-06-03 12:31:55.028881	59	\N	HEQ0007
1532	3	3	MAT-00604	FULGURATION ACTIVE HANDLE	53	15	5	2	7	45693.72	\N	Covered	\N	12	Non-Consumable	FULGURATION ACTIVE HANDLE	t	f	2026-06-03 12:31:55.030871	2026-06-03 12:31:55.03088	59	\N	HEQ0008
1533	3	3	MAT-00605	GASTROINTESTINAL VIDEOSCOPE GIF-H170  SERIAL NO.: 2135184	53	15	5	36	138	5365.81	\N	Covered	\N	12	Non-Consumable	GASTROINTESTINAL VIDEOSCOPE GIF-H170  SERIAL NO.: 2135184	t	f	2026-06-03 12:31:55.032773	2026-06-03 12:31:55.032782	59	\N	HEQ0009
1534	3	3	MAT-00606	HAMMER	53	15	5	4	13	19874.88	\N	Covered	\N	18	Non-Consumable	HAMMER	t	f	2026-06-03 12:31:55.034756	2026-06-03 12:31:55.034765	59	\N	HEQ0010
1535	3	3	MAT-00607	HDMI CABLE 20 MTR	53	15	5	2	5	29621.14	\N	Covered	\N	18	Consumable	HDMI CABLE 20 MTR	t	f	2026-06-03 12:31:55.036912	2026-06-03 12:31:55.036922	59	\N	HEQ0011
1536	3	3	MAT-00608	HITECH CLASS II B2 BIO SAFETY CABINET-CLEANLINESS ISO CLASS 5 AS PER 1SO 14644-1, AIR BALANCE: 100% EXHAUST 0% RE-CIRCULATION, WITH UV LAMP, WORKING TABLE, FRONT SASH, SIDE PANELS, HEPA FILTER, PRE-FILTER , MOC: IS 304 GRADE SS, SIZE: 4'X2'X2'	53	15	5	22	68	5266.35	\N	Covered	\N	18	Non-Consumable	HITECH CLASS II B2 BIO SAFETY CABINET-CLEANLINESS ISO CLASS 5 AS PER 1SO 14644-1, AIR BALANCE: 100% EXHAUST 0% RE-CIRCULATION, WITH UV LAMP, WORKING TABLE, FRONT SASH, SIDE PANELS, HEPA FILTER, PRE-FILTER , MOC: IS 304 GRADE SS, SIZE: 4'X2'X2'	t	f	2026-06-03 12:31:55.038961	2026-06-03 12:31:55.038971	59	\N	HEQ0012
1537	3	3	MAT-00609	IFT, TENS, EMS, RUSSIAN, ULTRAREIZ (UNISTIM 5S)	53	15	5	4	16	49023.93	\N	Covered	\N	12	Non-Consumable	IFT, TENS, EMS, RUSSIAN, ULTRAREIZ (UNISTIM 5S)	t	f	2026-06-03 12:31:55.041391	2026-06-03 12:31:55.041402	59	\N	HEQ0013
1538	3	3	MAT-00610	INSTRUMENT TROLLEY FULLY SS 304 GRADE AND WITH CASTORS WTHOUT BUCKET BASIN	53	15	5	24	59	6647.01	\N	Covered	\N	12	Non-Consumable	INSTRUMENT TROLLEY FULLY SS 304 GRADE AND WITH CASTORS WTHOUT BUCKET BASIN	t	f	2026-06-03 12:31:55.043766	2026-06-03 12:31:55.043775	59	\N	HEQ0014
1539	3	3	MAT-00611	IV STAND FULLY SS 304 GRADE FINISHED WITH CASTORS	53	15	5	4	11	12183.68	\N	Covered	\N	12	Non-Consumable	IV STAND FULLY SS 304 GRADE FINISHED WITH CASTORS	t	f	2026-06-03 12:31:55.04579	2026-06-03 12:31:55.045799	59	\N	HEQ0015
1540	3	3	MAT-00612	LEYLA RETRACTOR ACCESSORIES FOR ABOVE SUGITA- 1. LEYLA FLEXIBLE ARMS-2NOS, 2 SUGITA CLAMPS FOR LEYLA ARMS-2NOS, 3. BRAIN SPATULAS SET OF 8NOS (SET)	53	15	5	5	12	24847.88	\N	Covered	\N	12	Non-Consumable	LEYLA RETRACTOR ACCESSORIES FOR ABOVE SUGITA- 1. LEYLA FLEXIBLE ARMS-2NOS, 2 SUGITA CLAMPS FOR LEYLA ARMS-2NOS, 3. BRAIN SPATULAS SET OF 8NOS (SET)	t	f	2026-06-03 12:31:55.047744	2026-06-03 12:31:55.047752	59	\N	HEQ0016
1541	3	3	MAT-00613	LIP OUTER 750 (553350578-00)	53	15	5	3	11	39306.03	\N	Covered	\N	12	Non-Consumable	LIP OUTER 750 (553350578-00)	t	f	2026-06-03 12:31:55.049657	2026-06-03 12:31:55.049665	59	\N	HEQ0017
1542	3	3	MAT-00614	LIQUID NITROGENERAL CRYO MAXI 500ML - DOUBLE SEAL SYSTEM WITH STANDARD ACCESSORIES	53	15	5	4	12	11583.17	\N	Covered	\N	18	Non-Consumable	LIQUID NITROGENERAL CRYO MAXI 500ML - DOUBLE SEAL SYSTEM WITH STANDARD ACCESSORIES	t	f	2026-06-03 12:31:55.051584	2026-06-03 12:31:55.051592	59	\N	HEQ0018
1543	3	3	MAT-00615	MANTRA AADHAR FACE- MODEL: BIONIC M8, PROCESSOR: OCTA CORE 2.4GHZ, RAM:4GB,ROM:128GB, DISPLAY:6.5IN SRN, IPS LCD, OS:ANDROID, WALL MOUNTED	53	15	5	5	18	36719.16	\N	Covered	\N	18	Non-Consumable	MANTRA AADHAR FACE- MODEL: BIONIC M8, PROCESSOR: OCTA CORE 2.4GHZ, RAM:4GB,ROM:128GB, DISPLAY:6.5IN SRN, IPS LCD, OS:ANDROID, WALL MOUNTED	t	f	2026-06-03 12:31:55.053729	2026-06-03 12:31:55.053737	59	\N	HEQ0019
1544	3	3	MAT-00616	MEDELA - DOMINANT FLEX HIGH END - HIGER END DELIVERY/OT APPLICABLE SUCTION PUMP WITH 1 LTR JAR-2NOS, SILICON REUSABLE CUP 50MM& 60MM EACH, TROLLEY-1NO	53	15	5	5	12	26224.01	\N	Covered	\N	12	Non-Consumable	MEDELA - DOMINANT FLEX HIGH END - HIGER END DELIVERY/OT APPLICABLE SUCTION PUMP WITH 1 LTR JAR-2NOS, SILICON REUSABLE CUP 50MM& 60MM EACH, TROLLEY-1NO	t	f	2026-06-03 12:31:55.055756	2026-06-03 12:31:55.055765	59	\N	HEQ0020
1545	3	3	MAT-00617	MEDITRACK HOSPITAL PATIENT PRIVACY CUBICLE TRACK SYSTEMS AND CURTAINS WITH ALL ACCESSORIES	53	15	5	4	13	11652.68	\N	Covered	\N	18	Non-Consumable	MEDITRACK HOSPITAL PATIENT PRIVACY CUBICLE TRACK SYSTEMS AND CURTAINS WITH ALL ACCESSORIES	t	f	2026-06-03 12:31:55.058264	2026-06-03 12:31:55.058276	59	\N	HEQ0021
1546	3	3	MAT-00618	MINDRAY : MODEL: HYLED 600/600 DOUBLE DOME OT LIGHT	53	15	5	4	9	46697.06	\N	Covered	\N	12	Non-Consumable	MINDRAY : MODEL: HYLED 600/600 DOUBLE DOME OT LIGHT	t	f	2026-06-03 12:31:55.061137	2026-06-03 12:31:55.061147	59	\N	HEQ0022
1547	3	3	MAT-00619	MINDRAY : MODEL: HYLED 760/760 DOUBLE DOME OT LIGHT	53	15	5	3	12	22837.8	\N	Covered	\N	12	Non-Consumable	MINDRAY : MODEL: HYLED 760/760 DOUBLE DOME OT LIGHT	t	f	2026-06-03 12:31:55.063208	2026-06-03 12:31:55.063217	59	\N	HEQ0023
1548	3	3	MAT-00620	MINDRAY: MODEL BENEHEART D2 BIPHASIC DEFIBRILATORS WITH PACING. MANUAL, ECG  AND PACINGWITH STANDARD ACCESSORIES.	53	15	5	3	9	34953.44	\N	Covered	\N	12	Non-Consumable	MINDRAY: MODEL BENEHEART D2 BIPHASIC DEFIBRILATORS WITH PACING. MANUAL, ECG  AND PACINGWITH STANDARD ACCESSORIES.	t	f	2026-06-03 12:31:55.06518	2026-06-03 12:31:55.065189	59	\N	HEQ0024
1549	3	3	MAT-00621	NAK DELUXE CONTAINER 1300 WITHOUT LID	53	15	5	5	17	38380.41	\N	Covered	\N	18	Non-Consumable	NAK DELUXE CONTAINER 1300 WITHOUT LID	t	f	2026-06-03 12:31:55.067144	2026-06-03 12:31:55.067153	59	\N	HEQ0025
1550	3	3	MAT-00622	NASAL SUCTION SET OF 4	53	15	5	2	6	27558.45	\N	Covered	\N	12	Non-Consumable	NASAL SUCTION SET OF 4	t	f	2026-06-03 12:31:55.069076	2026-06-03 12:31:55.069092	59	\N	HEQ0026
1551	3	3	MAT-00623	OTOSCOPE HEIN GERMANY	53	15	5	23	78	8562.7	\N	Covered	\N	12	Non-Consumable	OTOSCOPE HEIN GERMANY	t	f	2026-06-03 12:31:55.071305	2026-06-03 12:31:55.071314	59	\N	HEQ0027
1552	3	3	MAT-00624	OXYGENERAL REGULATOR	53	15	5	5	16	39927.43	\N	Covered	\N	12	Non-Consumable	OXYGENERAL REGULATOR	t	f	2026-06-03 12:31:55.073508	2026-06-03 12:31:55.073519	59	\N	HEQ0028
1553	3	3	MAT-00625	OXYMAT DENMARK O430-30 PSA OXYGENERAL GENERALERATOR - 500 LPM	53	15	5	20	48	7267.6	\N	Covered	\N	12	Non-Consumable	OXYMAT DENMARK O430-30 PSA OXYGENERAL GENERALERATOR - 500 LPM	t	f	2026-06-03 12:31:55.076073	2026-06-03 12:31:55.076088	59	\N	HEQ0029
1554	3	3	MAT-00626	PADDLE PLATE ASSEMBLY WITH PADDLE PLATES FOR BPL BIPASIC DEFIBRILLATOR MODEL: DF 2617	53	15	5	2	8	20478.39	\N	Covered	\N	12	Non-Consumable	PADDLE PLATE ASSEMBLY WITH PADDLE PLATES FOR BPL BIPASIC DEFIBRILLATOR MODEL: DF 2617	t	f	2026-06-03 12:31:55.078078	2026-06-03 12:31:55.078093	59	\N	HEQ0030
1555	3	3	MAT-00627	PHILIPS 3 LEAD ECG CABLE/LEAD SET	53	15	5	3	8	43337.1	\N	Covered	\N	12	Consumable	PHILIPS 3 LEAD ECG CABLE/LEAD SET	t	f	2026-06-03 12:31:55.080097	2026-06-03 12:31:55.080106	59	\N	HEQ0031
1556	3	3	MAT-00628	PHILIPS TRILOGY ACTIVE W/PAP EXHALATION CIRCUIT, ADULT	53	15	5	4	10	16498.28	\N	Covered	\N	12	Non-Consumable	PHILIPS TRILOGY ACTIVE W/PAP EXHALATION CIRCUIT, ADULT	t	f	2026-06-03 12:31:55.082055	2026-06-03 12:31:55.082064	59	\N	HEQ0032
1557	3	3	MAT-00629	POWERMAX FITNESS BU-201 DUAL ACTION AIR BIKE WITH BACK SUPPOET (GYM CYCLE)	53	15	5	4	14	26314.22	\N	Covered	\N	18	Non-Consumable	POWERMAX FITNESS BU-201 DUAL ACTION AIR BIKE WITH BACK SUPPOET (GYM CYCLE)	t	f	2026-06-03 12:31:55.083991	2026-06-03 12:31:55.083999	59	\N	HEQ0033
1558	3	3	MAT-00630	PRESSURE BAG - GE	53	15	5	47	112	8638.21	\N	Covered	\N	12	Non-Consumable	PRESSURE BAG - GE	t	f	2026-06-03 12:31:55.085932	2026-06-03 12:31:55.085941	59	\N	HEQ0034
1559	3	3	MAT-00631	PROTECTION CAP-CASTOR- TOP (553350346-00)	53	15	5	5	16	47692.49	\N	Covered	\N	18	Non-Consumable	PROTECTION CAP-CASTOR- TOP (553350346-00)	t	f	2026-06-03 12:31:55.088043	2026-06-03 12:31:55.088056	59	\N	HEQ0035
1560	3	3	MAT-00632	PS24: SPARES FOR OPERATION THEATRE TABLE POWER SUPPLY	53	15	5	3	8	49302.85	\N	Covered	\N	18	Consumable	PS24: SPARES FOR OPERATION THEATRE TABLE POWER SUPPLY	t	f	2026-06-03 12:31:55.090218	2026-06-03 12:31:55.090229	59	\N	HEQ0036
1561	3	3	MAT-00633	PSI ATLAS ANESTHESIA MECHANICAL DOUBLE ARM PENDANT	53	15	5	5	18	14095.54	\N	Covered	\N	12	Non-Consumable	PSI ATLAS ANESTHESIA MECHANICAL DOUBLE ARM PENDANT	t	f	2026-06-03 12:31:55.092762	2026-06-03 12:31:55.092771	59	\N	HEQ0037
1562	3	3	MAT-00634	PSI LEGENERALD G.S TABLES WITH OPTIONAL ACCESSORIES FOR UROLOGY(1 SET)	53	15	5	3	12	41382.38	\N	Covered	\N	12	Non-Consumable	PSI LEGENERALD G.S TABLES WITH OPTIONAL ACCESSORIES FOR UROLOGY(1 SET)	t	f	2026-06-03 12:31:55.094813	2026-06-03 12:31:55.094821	59	\N	HEQ0038
1563	3	3	MAT-00635	PSI LEGENERALD ORTHO LEORT-BT: BASE TRACTION SYSTEM(BT) MULTI PURPOSE MOTORISED SURGICAL TABLE - ARM BRD (2) - ARM BRD CLAMP (2) - RADIAL SETTING CLAMP(2) - GEOPEL KNEE CRUTCH, SOCKET TYPE(2) SCREEN ROD	53	15	5	5	17	26966.35	\N	Covered	\N	12	Non-Consumable	PSI LEGENERALD ORTHO LEORT-BT: BASE TRACTION SYSTEM(BT) MULTI PURPOSE MOTORISED SURGICAL TABLE - ARM BRD (2) - ARM BRD CLAMP (2) - RADIAL SETTING CLAMP(2) - GEOPEL KNEE CRUTCH, SOCKET TYPE(2) SCREEN ROD	t	f	2026-06-03 12:31:55.096831	2026-06-03 12:31:55.09684	59	\N	HEQ0039
1564	3	3	MAT-00636	PULSE OXIMETER	53	15	5	5	18	38325.05	\N	Covered	\N	12	Non-Consumable	PULSE OXIMETER	t	f	2026-06-03 12:31:55.098789	2026-06-03 12:31:55.098797	59	\N	HEQ0040
1565	3	3	MAT-00637	RAISED ARM BOARD W/O CLAMP - AC1120	53	15	5	2	7	30636.94	\N	Covered	\N	12	Non-Consumable	RAISED ARM BOARD W/O CLAMP - AC1120	t	f	2026-06-03 12:31:55.100746	2026-06-03 12:31:55.100755	59	\N	HEQ0041
1566	3	3	MAT-00638	RESONA I9 - ULTRASOUND	53	15	5	4	15	43493.98	\N	Covered	\N	12	Non-Consumable	RESONA I9 - ULTRASOUND	t	f	2026-06-03 12:31:55.102831	2026-06-03 12:31:55.10284	59	\N	HEQ0042
1567	3	3	MAT-00639	RF ACTIVE HANDLE	53	15	5	2	5	19858.57	\N	Covered	\N	12	Non-Consumable	RF ACTIVE HANDLE	t	f	2026-06-03 12:31:55.104904	2026-06-03 12:31:55.104913	59	\N	HEQ0043
1568	3	3	MAT-00640	SANDING UNIT (RECIPROCAL EXERCISER) CODE 1462	53	15	5	4	15	24654.89	\N	Covered	\N	12	Non-Consumable	SANDING UNIT (RECIPROCAL EXERCISER) CODE 1462	t	f	2026-06-03 12:31:55.107066	2026-06-03 12:31:55.107077	59	\N	HEQ0044
1569	3	3	MAT-00641	SECURAYE SAB 3000 (STQC APPROVED ACCESS FM220U L1 SCANNER) WITH WIFI & LAN AADHAR ENABLED BIOMETRIC MACHINE	53	15	5	37	108	8592.26	\N	Covered	\N	18	Non-Consumable	SECURAYE SAB 3000 (STQC APPROVED ACCESS FM220U L1 SCANNER) WITH WIFI & LAN AADHAR ENABLED BIOMETRIC MACHINE	t	f	2026-06-03 12:31:55.109577	2026-06-03 12:31:55.109586	59	\N	HEQ0045
1570	3	3	MAT-00642	SEMI FOWLER COT WITH (SS WITH 304 GRADE) SS BOWL & SS SIDE WITH  IV ROD & POWDER COATED	53	15	5	5	13	14405.2	\N	Covered	\N	12	Non-Consumable	SEMI FOWLER COT WITH (SS WITH 304 GRADE) SS BOWL & SS SIDE WITH  IV ROD & POWDER COATED	t	f	2026-06-03 12:31:55.111548	2026-06-03 12:31:55.111556	59	\N	HEQ0046
1571	3	3	MAT-00643	SHALYA LX ELECTRO SURGICAL UNIT - 6 SENSE TECHNOLOGY	53	15	5	5	12	35511.79	\N	Covered	\N	12	Non-Consumable	SHALYA LX ELECTRO SURGICAL UNIT - 6 SENSE TECHNOLOGY	t	f	2026-06-03 12:31:55.113509	2026-06-03 12:31:55.113518	59	\N	HEQ0047
1572	3	3	MAT-00644	SINUSCOPE - 0D [SS1-TC00] - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	53	15	5	4	15	13883.58	\N	Covered	\N	12	Non-Consumable	SINUSCOPE - 0D [SS1-TC00] - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	t	f	2026-06-03 12:31:55.115476	2026-06-03 12:31:55.115485	59	\N	HEQ0048
1573	3	3	MAT-00645	SINUSCOPE - 30D [SS1-TC30] - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	53	15	5	5	20	37736.02	\N	Covered	\N	12	Non-Consumable	SINUSCOPE - 30D [SS1-TC30] - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	t	f	2026-06-03 12:31:55.117444	2026-06-03 12:31:55.117452	59	\N	HEQ0049
1574	3	3	MAT-00646	SINUSCOPE - 45 DEGREE - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	53	15	5	4	10	22484.97	\N	Covered	\N	12	Non-Consumable	SINUSCOPE - 45 DEGREE - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	t	f	2026-06-03 12:31:55.119498	2026-06-03 12:31:55.119507	59	\N	HEQ0050
1575	3	3	MAT-00647	SINUSCOPE - 70D [SS1-TC00] - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	53	15	5	46	121	8132.32	\N	Covered	\N	12	Non-Consumable	SINUSCOPE - 70D [SS1-TC00] - DIAMETER 4MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	t	f	2026-06-03 12:31:55.12164	2026-06-03 12:31:55.121648	59	\N	HEQ0051
1576	3	3	MAT-00648	SINUSCOPE - PAEDIATIC  0 DEGREE - DIAMETER 2.5MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	53	15	5	5	15	15795.39	\N	Covered	\N	12	Non-Consumable	SINUSCOPE - PAEDIATIC  0 DEGREE - DIAMETER 2.5MM/LENGTH: 175 MM WITH IMPROVISED OPTICS AND ENLARGED VIEW	t	f	2026-06-03 12:31:55.123752	2026-06-03 12:31:55.123764	59	\N	HEQ0052
1577	3	3	MAT-00649	SKIN PROBE SENSORS-FANEM	53	15	5	5	18	45399.7	\N	Covered	\N	12	Non-Consumable	SKIN PROBE SENSORS-FANEM	t	f	2026-06-03 12:31:55.126283	2026-06-03 12:31:55.126293	59	\N	HEQ0053
1578	3	3	MAT-00650	SLEEP APNEA DEVICE - FOR SLEEP STUDY - RESMED GERMANY	53	15	5	4	14	49455.41	\N	Covered	\N	12	Non-Consumable	SLEEP APNEA DEVICE - FOR SLEEP STUDY - RESMED GERMANY	t	f	2026-06-03 12:31:55.128347	2026-06-03 12:31:55.128355	59	\N	HEQ0054
1579	3	3	MAT-00651	SMALL SS TROLLEY FULLY STAINLESS STEEL WITH 2 SHELF WITH 3 SIDE RAILINGS FINISHED WITH CASTORS WITH BRAKE	53	15	5	2	7	15299.93	\N	Covered	\N	12	Non-Consumable	SMALL SS TROLLEY FULLY STAINLESS STEEL WITH 2 SHELF WITH 3 SIDE RAILINGS FINISHED WITH CASTORS WITH BRAKE	t	f	2026-06-03 12:31:55.130304	2026-06-03 12:31:55.130312	59	\N	HEQ0055
1580	3	3	MAT-00652	SPO2 EDAN PROBE-RUBBER TYPE - 6 PINS	53	15	5	4	15	29949.79	\N	Covered	\N	12	Non-Consumable	SPO2 EDAN PROBE-RUBBER TYPE - 6 PINS	t	f	2026-06-03 12:31:55.132251	2026-06-03 12:31:55.132259	59	\N	HEQ0056
1581	3	3	MAT-00653	SSD 256GB	53	15	5	4	15	44077.48	\N	Covered	\N	18	Non-Consumable	SSD 256GB	t	f	2026-06-03 12:31:55.134188	2026-06-03 12:31:55.134196	59	\N	HEQ0057
1582	3	3	MAT-00654	SUGITA HEAD FRAME COMPLETE SET: ROTATABLE HEAD HOLDER, HEAD- PIN, ARM BASE, FRAME UPGRADE KIT, HAND REST, BASAL FRAME, SLIDE ADJUSTER, ADUSTABLE HAND REST WITH DOME SCREW & SLIDE, COTTON PLATE, SPRING HOOK, INSTRUMENT RECEPTACLE	53	15	5	3	10	29439.73	\N	Covered	\N	12	Non-Consumable	SUGITA HEAD FRAME COMPLETE SET: ROTATABLE HEAD HOLDER, HEAD- PIN, ARM BASE, FRAME UPGRADE KIT, HAND REST, BASAL FRAME, SLIDE ADJUSTER, ADUSTABLE HAND REST WITH DOME SCREW & SLIDE, COTTON PLATE, SPRING HOOK, INSTRUMENT RECEPTACLE	t	f	2026-06-03 12:31:55.136097	2026-06-03 12:31:55.136106	59	\N	HEQ0058
1583	3	3	MAT-00655	SUPREME CHAIR (BEIGE COLOUR)	53	15	5	17	50	7062.24	\N	Covered	\N	18	Non-Consumable	SUPREME CHAIR (BEIGE COLOUR)	t	f	2026-06-03 12:31:55.138235	2026-06-03 12:31:55.138243	59	\N	HEQ0059
1618	3	3	MAT-00690	ID BAND PAEDATRICS	63	54	5	3	11	14635.73	\N	Covered	\N	12	Consumable	ID BAND PAEDATRICS	t	f	2026-06-03 12:31:55.256596	2026-06-03 12:31:55.256606	59	\N	HOI0027
1584	3	3	MAT-00656	THULIUM FIBER LASER 60WATTS FROM QUANTA, ITALY MAKE WITH RAYEKKEN MORCELLATOR, FLEXIBLE SCOPES, RESECTOSCOPE & MORCELLOSCOPE	53	15	5	5	17	10214.64	\N	Covered	\N	12	Non-Consumable	THULIUM FIBER LASER 60WATTS FROM QUANTA, ITALY MAKE WITH RAYEKKEN MORCELLATOR, FLEXIBLE SCOPES, RESECTOSCOPE & MORCELLOSCOPE	t	f	2026-06-03 12:31:55.140517	2026-06-03 12:31:55.140528	59	\N	HEQ0060
1585	3	3	MAT-00657	TMT PAPERS(A4 SIZE)	53	15	11	5	14	42261.72	\N	Covered	\N	12	Non-Consumable	TMT PAPERS(A4 SIZE)	t	f	2026-06-03 12:31:55.142994	2026-06-03 12:31:55.143004	59	\N	HEQ0061
1586	3	3	MAT-00658	TOURNIQUET - ELECTRONIC - AUTO - MANUAL- SINGLE - MEKTRONIC	53	15	5	4	13	37918.36	\N	Covered	\N	12	Non-Consumable	TOURNIQUET - ELECTRONIC - AUTO - MANUAL- SINGLE - MEKTRONIC	t	f	2026-06-03 12:31:55.145217	2026-06-03 12:31:55.145226	59	\N	HEQ0062
1587	3	3	MAT-00659	VIDEO SYSTEM CENTRE CV-170(PAL) 200V SERIAL NO.: 7112816	53	15	5	2	5	37892.47	\N	Covered	\N	12	Non-Consumable	VIDEO SYSTEM CENTRE CV-170(PAL) 200V SERIAL NO.: 7112816	t	f	2026-06-03 12:31:55.14739	2026-06-03 12:31:55.147401	59	\N	HEQ0063
1588	3	3	MAT-00660	VIDEOSCOPE CABLE FOR CV-150 MAJ-1558 SERIAL NO.: 7120073	53	15	5	4	12	33801.64	\N	Covered	\N	12	Non-Consumable	VIDEOSCOPE CABLE FOR CV-150 MAJ-1558 SERIAL NO.: 7120073	t	f	2026-06-03 12:31:55.190328	2026-06-03 12:31:55.190346	59	\N	HEQ0064
1589	3	3	MAT-00661	VISITOR CHAIR WITH MODULED CUSHION SEAT AND BACK	53	15	5	17	38	8471.37	\N	Covered	\N	18	Non-Consumable	VISITOR CHAIR WITH MODULED CUSHION SEAT AND BACK	t	f	2026-06-03 12:31:55.193067	2026-06-03 12:31:55.193077	59	\N	HEQ0065
1590	3	3	MAT-00662	VIVID T9 R5 MACHINE WITH PROBES AND PRINTER	53	15	5	15	43	6450.23	\N	Covered	\N	12	Non-Consumable	VIVID T9 R5 MACHINE WITH PROBES AND PRINTER	t	f	2026-06-03 12:31:55.195107	2026-06-03 12:31:55.195116	59	\N	HEQ0066
1591	3	3	MAT-00663	VP SHUNT TUNNELER PEDIATRIC	53	15	5	5	12	11137.1	\N	Covered	\N	12	Non-Consumable	VP SHUNT TUNNELER PEDIATRIC	t	f	2026-06-03 12:31:55.197051	2026-06-03 12:31:55.197059	59	\N	HEQ0067
1592	3	3	MAT-00664	APL VALVE FOR AESPIRE 7900	63	54	5	5	20	44307.7	\N	Covered	\N	12	Consumable	APL VALVE FOR AESPIRE 7900	t	f	2026-06-03 12:31:55.202245	2026-06-03 12:31:55.202254	59	\N	HOI0001
1593	3	3	MAT-00665	BARIATIC - TROCAR AND CANNULA PLAIN PYRAMIDAL DIA 10MM L EOMED	63	54	5	5	15	35694.25	\N	Covered	\N	12	Consumable	BARIATIC - TROCAR AND CANNULA PLAIN PYRAMIDAL DIA 10MM L EOMED	t	f	2026-06-03 12:31:55.203385	2026-06-03 12:31:55.203395	59	\N	HOI0002
1594	3	3	MAT-00666	BARIATIC - TROCAR AND CANNULA PLAIN PYRAMIDAL DIA 5MM LEOMED	63	54	5	21	55	6848.4	\N	Covered	\N	12	Consumable	BARIATIC - TROCAR AND CANNULA PLAIN PYRAMIDAL DIA 5MM LEOMED	t	f	2026-06-03 12:31:55.205522	2026-06-03 12:31:55.205531	59	\N	HOI0003
1595	3	3	MAT-00667	BARIATIC MONOPOLAR L HOOK ELECTRODE (TEFLON) DIA 5MM, L 40CM OM SURGICALS	63	54	5	2	6	47287.7	\N	Covered	\N	12	Consumable	BARIATIC MONOPOLAR L HOOK ELECTRODE (TEFLON) DIA 5MM, L 40CM OM SURGICALS	t	f	2026-06-03 12:31:55.207804	2026-06-03 12:31:55.207816	59	\N	HOI0004
1596	3	3	MAT-00668	BI-FYNGER HANDLE MARYLAND JAW-K9 - OM SURGICALS	63	54	5	3	7	29690.92	\N	Covered	\N	12	Consumable	BI-FYNGER HANDLE MARYLAND JAW-K9 - OM SURGICALS	t	f	2026-06-03 12:31:55.21032	2026-06-03 12:31:55.210329	59	\N	HOI0005
1597	3	3	MAT-00669	BONE CHISEL	63	54	5	3	10	43644.7	\N	Covered	\N	12	Non-Consumable	BONE CHISEL	t	f	2026-06-03 12:31:55.212366	2026-06-03 12:31:55.212375	59	\N	HOI0006
1598	3	3	MAT-00670	BP BLADDER	63	54	5	2	6	45466.78	\N	Covered	\N	12	Non-Consumable	BP BLADDER	t	f	2026-06-03 12:31:55.214383	2026-06-03 12:31:55.214392	59	\N	HOI0007
1599	3	3	MAT-00671	BP HINGES	63	54	5	3	9	49756.97	\N	Covered	\N	12	Non-Consumable	BP HINGES	t	f	2026-06-03 12:31:55.216338	2026-06-03 12:31:55.216346	59	\N	HOI0008
1600	3	3	MAT-00672	CO2 LUER LOCK 5MM	63	54	5	34	117	8656.52	\N	Covered	\N	12	Consumable	CO2 LUER LOCK 5MM	t	f	2026-06-03 12:31:55.218281	2026-06-03 12:31:55.21829	59	\N	HOI0009
1601	3	3	MAT-00673	COMEDONE EXTRACTOR MEDIUM SIZE	63	54	5	5	15	45054.81	\N	Covered	\N	12	Non-Consumable	COMEDONE EXTRACTOR MEDIUM SIZE	t	f	2026-06-03 12:31:55.220334	2026-06-03 12:31:55.220344	59	\N	HOI0010
1602	3	3	MAT-00674	CRASH CART TROLLY FULLY 304 GRADE SS 6 COLOUR BIN 6 BRAWER	63	54	5	2	6	23128.31	\N	Covered	\N	12	Non-Consumable	CRASH CART TROLLY FULLY 304 GRADE SS 6 COLOUR BIN 6 BRAWER	t	f	2026-06-03 12:31:55.222649	2026-06-03 12:31:55.222659	59	\N	HOI0011
1603	3	3	MAT-00675	DIAMOND STANDARD ARM CUFF	63	54	5	4	13	21765.97	\N	Covered	\N	12	Non-Consumable	DIAMOND STANDARD ARM CUFF	t	f	2026-06-03 12:31:55.225004	2026-06-03 12:31:55.225016	59	\N	HOI0012
1604	3	3	MAT-00676	DIAMOND TOUNIQUET LONG LEG ARM CUFF	63	54	5	5	18	15145.42	\N	Covered	\N	12	Non-Consumable	DIAMOND TOUNIQUET LONG LEG ARM CUFF	t	f	2026-06-03 12:31:55.227435	2026-06-03 12:31:55.227444	59	\N	HOI0013
1605	3	3	MAT-00677	DIAMOND TOUNIQUET LONG LEG CUFF FOR LEG	63	54	5	48	128	5257.36	\N	Covered	\N	12	Non-Consumable	DIAMOND TOUNIQUET LONG LEG CUFF FOR LEG	t	f	2026-06-03 12:31:55.22951	2026-06-03 12:31:55.229518	59	\N	HOI0014
1606	3	3	MAT-00678	DIAMOND TOURNIQUET EXTRA LONG -TKR	63	54	5	4	9	48302.14	\N	Covered	\N	12	Non-Consumable	DIAMOND TOURNIQUET EXTRA LONG -TKR	t	f	2026-06-03 12:31:55.231533	2026-06-03 12:31:55.231542	59	\N	HOI0015
1607	3	3	MAT-00679	DIFIBRILLATOR PRINT ROLL 50MM	63	54	12	5	19	10792.82	\N	Covered	\N	18	Consumable	DIFIBRILLATOR PRINT ROLL 50MM	t	f	2026-06-03 12:31:55.233514	2026-06-03 12:31:55.233522	59	\N	HOI0016
1608	3	3	MAT-00680	DIGITAL THERMOMETER	63	54	5	5	11	27081.45	\N	Covered	\N	12	Non-Consumable	DIGITAL THERMOMETER	t	f	2026-06-03 12:31:55.235436	2026-06-03 12:31:55.235444	59	\N	HOI0017
1609	3	3	MAT-00681	DIGITAL WEIGHING SCALE	63	54	5	5	12	33986.93	\N	Covered	\N	18	Non-Consumable	DIGITAL WEIGHING SCALE	t	f	2026-06-03 12:31:55.237557	2026-06-03 12:31:55.237566	59	\N	HOI0018
1610	3	3	MAT-00682	ECG BULB ELECTRODE PACK OF 6	63	54	5	3	11	34172.66	\N	Covered	\N	12	Non-Consumable	ECG BULB ELECTRODE PACK OF 6	t	f	2026-06-03 12:31:55.239653	2026-06-03 12:31:55.239662	59	\N	HOI0019
1611	3	3	MAT-00683	EDAN ECG CABLE	63	54	5	3	8	39306.59	\N	Covered	\N	12	Non-Consumable	EDAN ECG CABLE	t	f	2026-06-03 12:31:55.242106	2026-06-03 12:31:55.242118	59	\N	HOI0020
1612	3	3	MAT-00684	EVISCERATION SPOON (CC-2069)	63	54	5	2	5	39320.32	\N	Covered	\N	12	Non-Consumable	EVISCERATION SPOON (CC-2069)	t	f	2026-06-03 12:31:55.244589	2026-06-03 12:31:55.244597	59	\N	HOI0021
1613	3	3	MAT-00685	FINGER PULSEOXYMETER	63	54	5	3	9	37710	\N	Covered	\N	12	Non-Consumable	FINGER PULSEOXYMETER	t	f	2026-06-03 12:31:55.246622	2026-06-03 12:31:55.24663	59	\N	HOI0022
1614	3	3	MAT-00686	FLOW METER	63	54	5	33	130	9658.1	\N	Covered	\N	12	Non-Consumable	FLOW METER	t	f	2026-06-03 12:31:55.248576	2026-06-03 12:31:55.248584	59	\N	HOI0023
1615	3	3	MAT-00687	GAUGE BAYONET	63	54	5	2	6	47567.59	\N	Covered	\N	12	Non-Consumable	GAUGE BAYONET	t	f	2026-06-03 12:31:55.250474	2026-06-03 12:31:55.250482	59	\N	HOI0024
1616	3	3	MAT-00688	HOWARTH ELEVATOR	63	54	5	5	19	11907.18	\N	Covered	\N	12	Non-Consumable	HOWARTH ELEVATOR	t	f	2026-06-03 12:31:55.252405	2026-06-03 12:31:55.252414	59	\N	HOI0025
1617	3	3	MAT-00689	ID BAND ADULT	63	54	5	3	12	11598.95	\N	Covered	\N	12	Consumable	ID BAND ADULT	t	f	2026-06-03 12:31:55.25453	2026-06-03 12:31:55.254539	59	\N	HOI0026
1619	3	3	MAT-00691	KILLAN SPECULUM 1 1/2", 2", 2 1/2", 3", 3 1/2"	63	54	5	5	20	27175.33	\N	Covered	\N	12	Non-Consumable	KILLAN SPECULUM 1 1/2", 2", 2 1/2", 3", 3 1/2"	t	f	2026-06-03 12:31:55.259481	2026-06-03 12:31:55.259493	59	\N	HOI0028
1620	3	3	MAT-00692	KNEE HAMMER	63	54	5	3	7	18841.64	\N	Covered	\N	12	Non-Consumable	KNEE HAMMER	t	f	2026-06-03 12:31:55.261704	2026-06-03 12:31:55.261713	59	\N	HOI0029
1621	3	3	MAT-00693	LARYNGOSCOPE SS PAEDIATRIC BLADES 00.0.1	63	54	5	22	49	6958.97	\N	Covered	\N	12	Non-Consumable	LARYNGOSCOPE SS PAEDIATRIC BLADES 00.0.1	t	f	2026-06-03 12:31:55.263698	2026-06-03 12:31:55.263706	59	\N	HOI0030
1622	3	3	MAT-00694	LIM'S FORCEP - 1X2 TEETH 0.12MM	63	54	5	4	13	25972.42	\N	Covered	\N	12	Non-Consumable	LIM'S FORCEP - 1X2 TEETH 0.12MM	t	f	2026-06-03 12:31:55.265538	2026-06-03 12:31:55.265546	59	\N	HOI0031
1623	3	3	MAT-00695	LOADER AND PUSHER	63	54	5	3	10	27214.07	\N	Covered	\N	12	Non-Consumable	LOADER AND PUSHER	t	f	2026-06-03 12:31:55.267888	2026-06-03 12:31:55.267898	59	\N	HOI0032
1624	3	3	MAT-00696	MEDIUM ARTARY	63	54	5	3	9	25614.84	\N	Covered	\N	12	Non-Consumable	MEDIUM ARTARY	t	f	2026-06-03 12:31:55.270133	2026-06-03 12:31:55.270144	59	\N	HOI0033
1625	3	3	MAT-00697	MOLLUSCUM CURETTE MEDIUM SIZE	63	54	5	5	16	48400	\N	Covered	\N	12	Non-Consumable	MOLLUSCUM CURETTE MEDIUM SIZE	t	f	2026-06-03 12:31:55.272312	2026-06-03 12:31:55.272321	59	\N	HOI0034
1626	3	3	MAT-00698	NEEDLES 22G BD	63	55	14	5	20	25570.56	\N	Covered	\N	12	Consumable	NEEDLES 22G BD	t	f	2026-06-03 12:31:55.276421	2026-06-03 12:31:55.276432	59	\N	HOI0035
1627	3	3	MAT-00699	TMT ELECTRODE MEDICO ADULT	63	54	5	14	32	8647.55	\N	Covered	\N	12	Consumable	TMT ELECTRODE MEDICO ADULT	t	f	2026-06-03 12:31:55.277592	2026-06-03 12:31:55.2776	59	\N	HOI0036
1628	3	3	MAT-00700	BIOHAZARD PEDAL BIN 10 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL-RED	56	34	5	40	118	3274.38	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 10 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL-RED	t	f	2026-06-03 12:31:55.279591	2026-06-03 12:31:55.279599	53	\N	HSK0001
1629	3	3	MAT-00701	BIOHAZARD PEDAL BIN 10 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL-YELLOW	56	34	5	29	91	2349.47	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 10 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL-YELLOW	t	f	2026-06-03 12:31:55.281585	2026-06-03 12:31:55.281593	53	\N	HSK0002
1630	3	3	MAT-00702	BIOHAZARD PEDAL BIN 20 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL - WET & DRY	56	34	5	37	126	4635.13	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 20 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL - WET & DRY	t	f	2026-06-03 12:31:55.283556	2026-06-03 12:31:55.283565	53	\N	HSK0003
1631	3	3	MAT-00703	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL - BLACK	56	34	5	22	75	1686.18	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL - BLACK	t	f	2026-06-03 12:31:55.285515	2026-06-03 12:31:55.285523	53	\N	HSK0004
1632	3	3	MAT-00704	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL - BLUE	56	34	5	30	114	1833.65	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL - BLUE	t	f	2026-06-03 12:31:55.287524	2026-06-03 12:31:55.287533	53	\N	HSK0005
1633	3	3	MAT-00705	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL- YELLOW	56	34	5	77	298	455.84	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL- YELLOW	t	f	2026-06-03 12:31:55.289564	2026-06-03 12:31:55.289572	53	\N	HSK0006
1634	3	3	MAT-00706	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL-RED	56	34	5	10	27	2444.45	\N	Covered	\N	18	Consumable	BIOHAZARD PEDAL BIN 35 LTRS FIRST VIRGIN 99% PLASTIC MEDICAL-RED	t	f	2026-06-03 12:31:55.291963	2026-06-03 12:31:55.291974	53	\N	HSK0007
1635	3	3	MAT-00707	BLACK PHENYLE	56	35	7	41	90	4937.64	\N	Covered	\N	18	Consumable	BLACK PHENYLE	t	f	2026-06-03 12:31:55.29441	2026-06-03 12:31:55.294418	53	\N	HSK0008
1636	3	3	MAT-00708	BLEACHING POWDER	56	35	6	34	83	2321.98	\N	Covered	\N	18	Consumable	BLEACHING POWDER	t	f	2026-06-03 12:31:55.296354	2026-06-03 12:31:55.296363	53	\N	HSK0009
1637	3	3	MAT-00709	BOMBAY BROOM	56	35	5	37	128	4030.07	\N	Covered	\N	12	Consumable	BOMBAY BROOM	t	f	2026-06-03 12:31:55.298296	2026-06-03 12:31:55.298304	53	\N	HSK0010
1638	3	3	MAT-00710	BRITIF - B10 - HAND WASH LIQUID	56	35	5	166	464	611.9	\N	Covered	\N	18	Consumable	BRITIF - B10 - HAND WASH LIQUID	t	f	2026-06-03 12:31:55.300266	2026-06-03 12:31:55.300275	53	\N	HSK0011
1639	3	3	MAT-00711	BRITIF - B6 - TOILET BOWL CLEANER	56	35	5	223	474	353.18	\N	Covered	\N	18	Consumable	BRITIF - B6 - TOILET BOWL CLEANER	t	f	2026-06-03 12:31:55.302222	2026-06-03 12:31:55.302231	53	\N	HSK0012
1640	3	3	MAT-00712	BRITIF - B7 - FLOOR CLEANER CONCENTRATE	56	35	7	48	118	2025.96	\N	Covered	\N	18	Consumable	BRITIF - B7 - FLOOR CLEANER CONCENTRATE	t	f	2026-06-03 12:31:55.304319	2026-06-03 12:31:55.304328	53	\N	HSK0013
1641	3	3	MAT-00713	BRITIF B5 - ROOM FRESHNER ALL VARIANTS	56	35	7	36	99	3850.17	\N	Covered	\N	18	Consumable	BRITIF B5 - ROOM FRESHNER ALL VARIANTS	t	f	2026-06-03 12:31:55.306357	2026-06-03 12:31:55.306365	53	\N	HSK0014
1642	3	3	MAT-00714	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - BRITISH LAVENDER	56	35	21	35	96	3733.13	\N	Covered	\N	18	Consumable	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - BRITISH LAVENDER	t	f	2026-06-03 12:31:55.308805	2026-06-03 12:31:55.308914	53	\N	HSK0015
1643	3	3	MAT-00715	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - DREAM FLOWER	56	35	21	31	83	2337.18	\N	Covered	\N	18	Consumable	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - DREAM FLOWER	t	f	2026-06-03 12:31:55.311307	2026-06-03 12:31:55.311315	53	\N	HSK0016
1644	3	3	MAT-00716	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - MYSTIC JASMINE	56	35	21	47	151	1767.48	\N	Covered	\N	18	Consumable	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - MYSTIC JASMINE	t	f	2026-06-03 12:31:55.313347	2026-06-03 12:31:55.313356	53	\N	HSK0017
1645	3	3	MAT-00717	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - ROYAL BRUT	56	35	21	172	498	553.58	\N	Covered	\N	18	Consumable	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR - ROYAL BRUT	t	f	2026-06-03 12:31:55.315294	2026-06-03 12:31:55.315302	53	\N	HSK0018
1646	3	3	MAT-00718	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR -ODOR SANDAL	56	35	21	10	28	4138.36	\N	Covered	\N	18	Consumable	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR -ODOR SANDAL	t	f	2026-06-03 12:31:55.317257	2026-06-03 12:31:55.317266	53	\N	HSK0019
1647	3	3	MAT-00719	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR -STRAWBERRY CHILL	56	35	21	48	182	3479.01	\N	Covered	\N	18	Consumable	BRITISH CLEAN - BRITISH FRAGRANCES - (AIR-FRESHENER) - S5 - 5LTR -STRAWBERRY CHILL	t	f	2026-06-03 12:31:55.319273	2026-06-03 12:31:55.319281	53	\N	HSK0020
1648	3	3	MAT-00720	BRITISH CLEAN - S6 - TOILET BOWL CLEANER - 5LTR	56	35	21	19	60	3682.17	\N	Covered	\N	18	Consumable	BRITISH CLEAN - S6 - TOILET BOWL CLEANER - 5LTR	t	f	2026-06-03 12:31:55.321427	2026-06-03 12:31:55.321436	53	\N	HSK0021
1649	3	3	MAT-00721	BROOM STICK 555 MONKEY BRAND	56	35	5	33	123	4032.07	\N	Covered	\N	12	Consumable	BROOM STICK 555 MONKEY BRAND	t	f	2026-06-03 12:31:55.323468	2026-06-03 12:31:55.323477	53	\N	HSK0022
1650	3	3	MAT-00722	CAUTION BOARD WITH 'RESTROOM OUT OF SERVICE FOR MAINTENANCE'	56	35	5	12	30	3455.5	\N	Covered	\N	18	Non-Consumable	CAUTION BOARD WITH 'RESTROOM OUT OF SERVICE FOR MAINTENANCE'	t	f	2026-06-03 12:31:55.326052	2026-06-03 12:31:55.326064	53	\N	HSK0023
1651	3	3	MAT-00723	COB WEB STICK	56	35	5	47	96	2869.03	\N	Covered	\N	12	Consumable	COB WEB STICK	t	f	2026-06-03 12:31:55.328364	2026-06-03 12:31:55.328373	53	\N	HSK0024
1652	3	3	MAT-00724	COCONUT BROOMSTICK	56	35	5	17	44	4165.89	\N	Covered	\N	12	Consumable	COCONUT BROOMSTICK	t	f	2026-06-03 12:31:55.330356	2026-06-03 12:31:55.330365	53	\N	HSK0025
1653	3	3	MAT-00725	DUST PAN	56	35	5	353	1102	928.93	\N	Covered	\N	18	Non-Consumable	DUST PAN	t	f	2026-06-03 12:31:55.332314	2026-06-03 12:31:55.332323	53	\N	HSK0026
1654	3	3	MAT-00726	FLASH IN 200 - FLOOR CLEANER FOR HARD SURFACES (1:30) - 5LTR	56	35	21	15	43	1338.23	\N	Covered	\N	18	Consumable	FLASH IN 200 - FLOOR CLEANER FOR HARD SURFACES (1:30) - 5LTR	t	f	2026-06-03 12:31:55.334295	2026-06-03 12:31:55.334303	53	\N	HSK0027
1655	3	3	MAT-00727	FLASH IN 230 - MULTI-SURFACE & GLASS CLEANER - 5LTR	56	35	21	26	79	2503.5	\N	Covered	\N	18	Consumable	FLASH IN 230 - MULTI-SURFACE & GLASS CLEANER - 5LTR	t	f	2026-06-03 12:31:55.33626	2026-06-03 12:31:55.336268	53	\N	HSK0028
1656	3	3	MAT-00728	FLASH IN 270 - SANITARY CARE-TOILET FLOOR, TILES&BATHROOM FITTINGS - 5LTR	56	35	21	298	636	790.67	\N	Covered	\N	18	Consumable	FLASH IN 270 - SANITARY CARE-TOILET FLOOR, TILES&BATHROOM FITTINGS - 5LTR	t	f	2026-06-03 12:31:55.338349	2026-06-03 12:31:55.338357	53	\N	HSK0029
1657	3	3	MAT-00729	FLASH IN 600 - HD FLOOR CARE 1:30 - 5 LTR	56	35	21	30	71	3186.08	\N	Covered	\N	18	Consumable	FLASH IN 600 - HD FLOOR CARE 1:30 - 5 LTR	t	f	2026-06-03 12:31:55.340484	2026-06-03 12:31:55.340494	53	\N	HSK0030
1658	3	3	MAT-00730	GARBAGE BAGS - 40 MICRONS - LARGE SIZE	56	35	6	35	99	2958.7	\N	Covered	\N	18	Consumable	GARBAGE BAGS - 40 MICRONS - LARGE SIZE	t	f	2026-06-03 12:31:55.343121	2026-06-03 12:31:55.343132	53	\N	HSK0031
1659	3	3	MAT-00731	GARBAGE COVERS (FOOD WASTE) GREEN COLOUR	56	35	6	279	843	822.72	\N	Covered	\N	18	Consumable	GARBAGE COVERS (FOOD WASTE) GREEN COLOUR	t	f	2026-06-03 12:31:55.345296	2026-06-03 12:31:55.345305	53	\N	HSK0032
1660	3	3	MAT-00732	GARBAGE COVERS-SMALL	56	35	6	44	129	1295.27	\N	Covered	\N	18	Consumable	GARBAGE COVERS-SMALL	t	f	2026-06-03 12:31:55.347297	2026-06-03 12:31:55.347306	53	\N	HSK0033
1661	3	3	MAT-00733	GLASS APPLICATOR - 2 IN 1 (FULL SET)	56	35	5	50	151	1935.79	\N	Covered	\N	18	Consumable	GLASS APPLICATOR - 2 IN 1 (FULL SET)	t	f	2026-06-03 12:31:55.349218	2026-06-03 12:31:55.349227	53	\N	HSK0034
1662	3	3	MAT-00734	GLASS CLEANER - 5L	56	35	21	48	161	4199	\N	Covered	\N	18	Consumable	GLASS CLEANER - 5L	t	f	2026-06-03 12:31:55.351292	2026-06-03 12:31:55.351301	53	\N	HSK0035
1663	3	3	MAT-00735	GLASS CLEANING CLOTH	56	35	5	49	142	2450.06	\N	Covered	\N	12	Consumable	GLASS CLEANING CLOTH	t	f	2026-06-03 12:31:55.353364	2026-06-03 12:31:55.353373	53	\N	HSK0036
1664	3	3	MAT-00736	GOOD SENSE ODOUR ELIMINATOR	56	35	5	27	65	3556.14	\N	Covered	\N	18	Consumable	GOOD SENSE ODOUR ELIMINATOR	t	f	2026-06-03 12:31:55.355593	2026-06-03 12:31:55.355603	53	\N	HSK0037
1665	3	3	MAT-00737	HAND GLOVES (RUBBER) SET	56	35	27	48	115	2793.05	\N	Covered	\N	18	Consumable	HAND GLOVES (RUBBER) SET	t	f	2026-06-03 12:31:55.357988	2026-06-03 12:31:55.357999	53	\N	HSK0038
1666	3	3	MAT-00738	HAND WASH -5L CAN	56	35	21	15	60	3378.13	\N	Covered	\N	18	Consumable	HAND WASH -5L CAN	t	f	2026-06-03 12:31:55.360664	2026-06-03 12:31:55.360675	53	\N	HSK0039
1667	3	3	MAT-00739	HAND WASH BOTTLE	56	35	25	50	154	1918.04	\N	Covered	\N	18	Non-Consumable	HAND WASH BOTTLE	t	f	2026-06-03 12:31:55.36288	2026-06-03 12:31:55.362889	53	\N	HSK0040
1668	3	3	MAT-00740	MOP CLOTH REFILL	56	35	5	48	185	4172.2	\N	Covered	\N	12	Consumable	MOP CLOTH REFILL	t	f	2026-06-03 12:31:55.365049	2026-06-03 12:31:55.365058	53	\N	HSK0041
1669	3	3	MAT-00741	MOP REFILL WITH CLIP	56	35	5	38	85	2115.37	\N	Covered	\N	12	Consumable	MOP REFILL WITH CLIP	t	f	2026-06-03 12:31:55.367235	2026-06-03 12:31:55.367245	53	\N	HSK0042
1670	3	3	MAT-00742	MOP STICK FULL SET	56	35	5	26	96	3717.54	\N	Covered	\N	12	Consumable	MOP STICK FULL SET	t	f	2026-06-03 12:31:55.369342	2026-06-03 12:31:55.369351	53	\N	HSK0043
1671	3	3	MAT-00743	MUG PLASTIC	56	35	5	20	58	2043.37	\N	Covered	\N	18	Non-Consumable	MUG PLASTIC	t	f	2026-06-03 12:31:55.371732	2026-06-03 12:31:55.371742	53	\N	HSK0044
1672	3	3	MAT-00744	MULTIPURPOSE CLEANER STANDARD QLY - 5L CAN	56	35	21	23	74	2818.01	\N	Covered	\N	18	Consumable	MULTIPURPOSE CLEANER STANDARD QLY - 5L CAN	t	f	2026-06-03 12:31:55.373927	2026-06-03 12:31:55.373938	53	\N	HSK0045
1673	3	3	MAT-00745	PHENYLE	56	35	7	18	48	1737.33	\N	Covered	\N	18	Consumable	PHENYLE	t	f	2026-06-03 12:31:55.376634	2026-06-03 12:31:55.376645	53	\N	HSK0046
1674	3	3	MAT-00746	PLASTIC BUCKET SMALL - 5 LITRES	56	34	5	49	152	1613.46	\N	Covered	\N	18	Non-Consumable	PLASTIC BUCKET SMALL - 5 LITRES	t	f	2026-06-03 12:31:55.378941	2026-06-03 12:31:55.37895	53	\N	HSK0047
1675	3	3	MAT-00747	PLASTIC JUG	56	35	5	17	64	2106.8	\N	Covered	\N	18	Non-Consumable	PLASTIC JUG	t	f	2026-06-03 12:31:55.381111	2026-06-03 12:31:55.38112	53	\N	HSK0048
1676	3	3	MAT-00748	RED COVER	56	35	5	21	48	4813.9	\N	Covered	\N	18	Consumable	RED COVER	t	f	2026-06-03 12:31:55.383239	2026-06-03 12:31:55.383249	53	\N	HSK0049
1677	3	3	MAT-00749	ROAD T-BRUSH (WOODEN) FOR OT	56	35	5	11	38	3372.95	\N	Covered	\N	12	Non-Consumable	ROAD T-BRUSH (WOODEN) FOR OT	t	f	2026-06-03 12:31:55.385324	2026-06-03 12:31:55.385334	53	\N	HSK0050
1678	3	3	MAT-00750	ROOM FRESHNER	56	35	7	22	71	3922.91	\N	Covered	\N	18	Consumable	ROOM FRESHNER	t	f	2026-06-03 12:31:55.387612	2026-06-03 12:31:55.387623	53	\N	HSK0051
1679	3	3	MAT-00751	SANITIZER BOTTLE-EMPTY	56	35	25	24	91	4817.83	\N	Covered	\N	18	Non-Consumable	SANITIZER BOTTLE-EMPTY	t	f	2026-06-03 12:31:55.389889	2026-06-03 12:31:55.389898	53	\N	HSK0052
1680	3	3	MAT-00752	SCRUBBING PAD - STEEL	56	35	5	37	87	4368.94	\N	Covered	\N	18	Consumable	SCRUBBING PAD - STEEL	t	f	2026-06-03 12:31:55.392497	2026-06-03 12:31:55.39251	53	\N	HSK0053
1681	3	3	MAT-00753	SCRUBBING PAD (GREEN)	56	35	5	45	113	4653.8	\N	Covered	\N	18	Consumable	SCRUBBING PAD (GREEN)	t	f	2026-06-03 12:31:55.395017	2026-06-03 12:31:55.395027	53	\N	HSK0054
1682	3	3	MAT-00754	SOAP OIL	56	35	5	22	64	1690.35	\N	Covered	\N	18	Consumable	SOAP OIL	t	f	2026-06-03 12:31:55.397184	2026-06-03 12:31:55.397194	53	\N	HSK0055
1683	3	3	MAT-00755	SOFT BROOM	56	35	5	31	93	4990.81	\N	Covered	\N	12	Consumable	SOFT BROOM	t	f	2026-06-03 12:31:55.399452	2026-06-03 12:31:55.399463	53	\N	HSK0056
1684	3	3	MAT-00756	SPRAY GUN FLAT BEST	56	35	5	37	75	3896.29	\N	Covered	\N	18	Non-Consumable	SPRAY GUN FLAT BEST	t	f	2026-06-03 12:31:55.401866	2026-06-03 12:31:55.401876	53	\N	HSK0057
1685	3	3	MAT-00757	SUMA DRAIN CLEANER - TASKI	56	35	5	28	108	1753.53	\N	Covered	\N	18	Consumable	SUMA DRAIN CLEANER - TASKI	t	f	2026-06-03 12:31:55.404124	2026-06-03 12:31:55.404134	53	\N	HSK0058
1686	3	3	MAT-00758	SUMA SCALE 5LTR PCK OF 2	56	35	5	26	97	3689.61	\N	Covered	\N	18	Consumable	SUMA SCALE 5LTR PCK OF 2	t	f	2026-06-03 12:31:55.406398	2026-06-03 12:31:55.406407	53	\N	HSK0059
2084	3	3	MAT-01156	Solvent 1Ltr PVC	60	46	5	119	423	229.02	\N	Covered	\N	18	Consumable	Solvent 1Ltr PVC	t	f	2026-06-03 12:31:56.372428	2026-06-03 12:31:56.372438	59	\N	PLB0049
1687	3	3	MAT-00759	TILES CLEANING BRUSH WITH HANDLE - WOODEN	56	35	5	38	80	4523.14	\N	Covered	\N	12	Non-Consumable	TILES CLEANING BRUSH WITH HANDLE - WOODEN	t	f	2026-06-03 12:31:55.408922	2026-06-03 12:31:55.408935	53	\N	HSK0061
1688	3	3	MAT-00760	TOILET CLEANER - 5L CAN	56	35	5	43	116	3501.99	\N	Covered	\N	18	Consumable	TOILET CLEANER - 5L CAN	t	f	2026-06-03 12:31:55.411524	2026-06-03 12:31:55.411533	53	\N	HSK0062
1689	3	3	MAT-00761	URINAL CAKE 80GMS	56	35	22	15	59	4313.48	\N	Covered	\N	18	Consumable	URINAL CAKE 80GMS	t	f	2026-06-03 12:31:55.413661	2026-06-03 12:31:55.413671	53	\N	HSK0063
1690	3	3	MAT-00762	VACUUM CLEANER - SOTOP515NX - ROOTS SOLECO TOPPER 515 250NX, WET & DRY WITH SINGLE MOTOR, 33LTRS SS TANK	56	35	5	19	68	1065.67	\N	Covered	\N	18	Non-Consumable	VACUUM CLEANER - SOTOP515NX - ROOTS SOLECO TOPPER 515 250NX, WET & DRY WITH SINGLE MOTOR, 33LTRS SS TANK	t	f	2026-06-03 12:31:55.415752	2026-06-03 12:31:55.415761	53	\N	HSK0064
1691	3	3	MAT-00763	WIPER INOVA BIG	56	35	5	49	138	4588.42	\N	Covered	\N	12	Consumable	WIPER INOVA BIG	t	f	2026-06-03 12:31:55.417882	2026-06-03 12:31:55.417891	53	\N	HSK0065
1692	3	3	MAT-00764	YELLOW COVER	56	35	5	40	111	2253.04	\N	Covered	\N	18	Consumable	YELLOW COVER	t	f	2026-06-03 12:31:55.420025	2026-06-03 12:31:55.420034	53	\N	HSK0066
1693	3	3	MAT-00765	GLOVES - RUBBER HD	56	35	5	234	752	404.67	\N	Covered	\N	18	Consumable	GLOVES - RUBBER HD	t	f	2026-06-03 12:31:55.422317	2026-06-03 12:31:55.422327	53	\N	HSK0067
1694	3	3	MAT-00766	D-LINK DGS-1210-28MP	57	36	5	229	848	566.53	\N	Covered	\N	18	Non-Consumable	D-LINK DGS-1210-28MP	t	f	2026-06-03 12:31:55.424686	2026-06-03 12:31:55.424699	59	\N	ITI0001
1695	3	3	MAT-00767	KEY BOARD DELL KB216	57	36	5	16	35	3751.89	\N	Covered	\N	18	Non-Consumable	KEY BOARD DELL KB216	t	f	2026-06-03 12:31:55.427493	2026-06-03 12:31:55.427503	59	\N	ITI0002
1696	3	3	MAT-00768	MONITOR 20 INCHES DELL	57	36	5	48	137	4062.57	\N	Covered	\N	18	Non-Consumable	MONITOR 20 INCHES DELL	t	f	2026-06-03 12:31:55.429751	2026-06-03 12:31:55.42976	59	\N	ITI0003
1697	3	3	MAT-00769	D-LINK RJ45 CONNECTOR	57	36	5	25	69	2362.08	\N	Covered	\N	18	Non-Consumable	D-LINK RJ45 CONNECTOR	t	f	2026-06-03 12:31:55.431864	2026-06-03 12:31:55.431873	59	\N	ITI0004
1698	3	3	MAT-00770	D-Link DGS F1018P	57	36	5	36	113	1785.98	\N	Covered	\N	18	Non-Consumable	D-Link DGS F1018P	t	f	2026-06-03 12:31:55.434001	2026-06-03 12:31:55.434011	59	\N	ITI0005
1699	3	3	MAT-00771	D-Link DGS F1026P-E	57	36	5	436	972	711.06	\N	Covered	\N	18	Non-Consumable	D-Link DGS F1026P-E	t	f	2026-06-03 12:31:55.436093	2026-06-03 12:31:55.436102	59	\N	ITI0006
1700	3	3	MAT-00772	Rack Local 2U Unloaded	57	36	5	53	133	956.55	\N	Covered	\N	18	Non-Consumable	Rack Local 2U Unloaded	t	f	2026-06-03 12:31:55.438355	2026-06-03 12:31:55.438365	59	\N	ITI0007
1701	3	3	MAT-00773	D-Link DGS-1210-28	57	36	5	15	36	1351.8	\N	Covered	\N	18	Non-Consumable	D-Link DGS-1210-28	t	f	2026-06-03 12:31:55.44058	2026-06-03 12:31:55.44059	59	\N	ITI0008
1702	3	3	MAT-00774	SSD 256GB ZEBRONICS	57	36	5	17	37	2530.73	\N	Covered	\N	18	Non-Consumable	SSD 256GB ZEBRONICS	t	f	2026-06-03 12:31:55.443346	2026-06-03 12:31:55.443358	59	\N	ITI0009
1703	3	3	MAT-00775	Dell USB Mouse MS116	57	36	5	47	185	1080.6	\N	Covered	\N	18	Non-Consumable	Dell USB Mouse MS116	t	f	2026-06-03 12:31:55.445718	2026-06-03 12:31:55.445727	59	\N	ITI0010
1704	3	3	MAT-00776	Connector RJ Extender	57	36	5	426	1118	89.47	\N	Covered	\N	18	Non-Consumable	Connector RJ Extender	t	f	2026-06-03 12:31:55.4479	2026-06-03 12:31:55.44791	59	\N	ITI0011
1705	3	3	MAT-00777	D-Link DGS F1018P	57	36	5	16	48	3582.58	\N	Covered	\N	18	Non-Consumable	D-Link DGS F1018P	t	f	2026-06-03 12:31:55.450021	2026-06-03 12:31:55.450031	59	\N	ITI0012
1706	3	3	MAT-00778	D-Link DGS F1026P	57	36	5	30	62	3030.62	\N	Covered	\N	18	Non-Consumable	D-Link DGS F1026P	t	f	2026-06-03 12:31:55.452158	2026-06-03 12:31:55.452167	59	\N	ITI0013
1707	3	3	MAT-00779	Rack Local 2U Unloaded	57	36	5	357	880	916.14	\N	Covered	\N	18	Non-Consumable	Rack Local 2U Unloaded	t	f	2026-06-03 12:31:55.454335	2026-06-03 12:31:55.454346	59	\N	ITI0014
1708	3	3	MAT-00780	D-Link DGS-1250-28X	57	36	5	34	75	1801.35	\N	Covered	\N	18	Consumable	D-Link DGS-1250-28X	t	f	2026-06-03 12:31:55.456582	2026-06-03 12:31:55.456591	59	\N	ITI0015
1709	3	3	MAT-00781	Connector DP to HDMI VENTION	57	36	5	31	64	4897.96	\N	Covered	\N	18	Consumable	Connector DP to HDMI VENTION	t	f	2026-06-03 12:31:55.459131	2026-06-03 12:31:55.459144	59	\N	ITI0016
1710	3	3	MAT-00782	BLACK-I DP TO VGA CONVERTOR	57	36	5	50	176	3294.8	\N	Covered	\N	18	Consumable	BLACK-I DP TO VGA CONVERTOR	t	f	2026-06-03 12:31:55.461726	2026-06-03 12:31:55.461735	59	\N	ITI0017
1711	3	3	MAT-00783	Power Cable	57	36	5	50	175	4033.35	\N	Covered	\N	18	Consumable	Power Cable	t	f	2026-06-03 12:31:55.463946	2026-06-03 12:31:55.463955	59	\N	ITI0018
1712	3	3	MAT-00784	Dell Monitor P2219H Specifications : Model: Dell Monitor P2219H, Display Type: 54.61 cm (22 inch) Full HD LED Backlit IPS Panel Monitor, Response Time: 8 ms, Refresh Rate: 60 Hz	57	36	5	15	45	1097.71	\N	Covered	\N	18	Non-Consumable	Dell Monitor P2219H Specifications : Model: Dell Monitor P2219H, Display Type: 54.61 cm (22 inch) Full HD LED Backlit IPS Panel Monitor, Response Time: 8 ms, Refresh Rate: 60 Hz	t	f	2026-06-03 12:31:55.466077	2026-06-03 12:31:55.466092	59	\N	ITI0019
1713	3	3	MAT-00785	Lenovo Used Desktop Specifications : Processor: Intel Core i5 9th GENERAL, Memory (RAM): 16GB, Storage: 256GB SSD, Operating System: Windows 10 Pro, Connectivity: Wi-Fi built-in	57	36	5	13	38	3909.85	\N	Covered	\N	18	Non-Consumable	Lenovo Used Desktop Specifications : Processor: Intel Core i5 9th GENERAL, Memory (RAM): 16GB, Storage: 256GB SSD, Operating System: Windows 10 Pro, Connectivity: Wi-Fi built-in	t	f	2026-06-03 12:31:55.46816	2026-06-03 12:31:55.468169	59	\N	ITI0020
1714	3	3	MAT-00786	Dell Monitor P2219H : Display: 54.61 cm (22 inch) Full HD LED Backlit IPS Panel, Performance: 8 ms Response Time; 60 Hz Refresh Rate, Video Inputs:1 x DisplayPort 1.2, 1 x HDMI 1.4, 1 x VGA, USB Hub: * 1 x USB Type-B (Upstream) : 2 x USB Type-A (USB 	57	36	5	39	132	4442.81	\N	Covered	\N	18	Non-Consumable	Dell Monitor P2219H : Display: 54.61 cm (22 inch) Full HD LED Backlit IPS Panel, Performance: 8 ms Response Time; 60 Hz Refresh Rate, Video Inputs:1 x DisplayPort 1.2, 1 x HDMI 1.4, 1 x VGA, USB Hub: * 1 x USB Type-B (Upstream) : 2 x USB Type-A (USB 3.1 / 3.2 GENERAL 1), 2 x USB Type-A (USB 2.0) Dell Monitor P2219H : Display: 54.61 cm (22 inch) Full HD LED Backlit IPS Panel, Performance: 8 ms Response Time; 60 Hz Refresh Rate, Video Inputs:1 x DisplayPort 1.2, 1 x HDMI 1.4, 1 x VGA, USB Hub: * 1 x USB Type-B (Upstream) : 2 x USB Type-A (USB 3.1 / 3.2 GENERAL 1), 2 x USB Type-A (USB 2.0)	t	f	2026-06-03 12:31:55.470274	2026-06-03 12:31:55.470284	59	\N	ITI0021
1715	3	3	MAT-00787	AM-DM2069-FMA1 2MP IP Fixed Lens Bullet AVATRON	57	36	5	24	91	3600.9	\N	Covered	\N	18	Consumable	AM-DM2069-FMA1 2MP IP Fixed Lens Bullet AVATRON	t	f	2026-06-03 12:31:55.47257	2026-06-03 12:31:55.472579	59	\N	ITI0022
1716	3	3	MAT-00788	AM-i880-UHD 80Ch INTELLIGENERALT RAID NVR AVATRON	57	36	5	485	1777	278.91	\N	Covered	\N	18	Consumable	AM-i880-UHD 80Ch INTELLIGENERALT RAID NVR AVATRON	t	f	2026-06-03 12:31:55.474972	2026-06-03 12:31:55.474984	59	\N	ITI0023
1717	3	3	MAT-00789	Cat 6 Cable 305 Mtrs ANCHOR	57	36	5	24	53	3791.22	\N	Covered	\N	18	Consumable	Cat 6 Cable 305 Mtrs ANCHOR	t	f	2026-06-03 12:31:55.477681	2026-06-03 12:31:55.477691	59	\N	ITI0024
1718	3	3	MAT-00790	IP Camera AM-DM2009-FMA1 H.265+2MP IR IP AVATRON	57	36	5	187	453	780.87	\N	Covered	\N	18	Non-Consumable	IP Camera AM-DM2009-FMA1 H.265+2MP IR IP AVATRON	t	f	2026-06-03 12:31:55.479935	2026-06-03 12:31:55.479944	59	\N	ITI0025
1719	3	3	MAT-00791	PHOTOCOPIER MACHINE B/W  KONICA MINOLTA  BIZHUB 367	57	36	5	12	42	1918.81	\N	Covered	\N	18	Non-Consumable	PHOTOCOPIER MACHINE B/W  KONICA MINOLTA  BIZHUB 367	t	f	2026-06-03 12:31:55.482009	2026-06-03 12:31:55.482018	59	\N	ITI0026
1720	3	3	MAT-00792	PHOTOCOPIER MACHINE B/W  TOSHIBA E-STUDIO 5518A	57	36	5	35	91	4801.01	\N	Covered	\N	18	Non-Consumable	PHOTOCOPIER MACHINE B/W  TOSHIBA E-STUDIO 5518A	t	f	2026-06-03 12:31:55.483976	2026-06-03 12:31:55.483985	59	\N	ITI0027
1721	3	3	MAT-00793	PHOTOCOPIER MACHINE B/W  KONICA MINOLTA  BIZHUB 551i	57	36	5	50	181	1692.72	\N	Covered	\N	18	Non-Consumable	PHOTOCOPIER MACHINE B/W  KONICA MINOLTA  BIZHUB 551i	t	f	2026-06-03 12:31:55.486099	2026-06-03 12:31:55.486109	59	\N	ITI0028
1722	3	3	MAT-00794	PHOTOCOPIER MACHINE B/W  KONICA MINOLTA  BIZHUB 225i	57	36	5	48	124	3399.25	\N	Covered	\N	18	Consumable	PHOTOCOPIER MACHINE B/W  KONICA MINOLTA  BIZHUB 225i	t	f	2026-06-03 12:31:55.488323	2026-06-03 12:31:55.488332	59	\N	ITI0029
1723	3	3	MAT-00795	PRINTER KONICA MINOLTA BIZHUB 165EN	57	36	5	28	83	3344	\N	Covered	\N	18	Consumable	PRINTER KONICA MINOLTA BIZHUB 165EN	t	f	2026-06-03 12:31:55.490573	2026-06-03 12:31:55.490583	59	\N	ITI0030
1724	3	3	MAT-00796	PRINTER HP LASERJET 1020	57	36	5	453	1788	926	\N	Covered	\N	18	Consumable	PRINTER HP LASERJET 1020	t	f	2026-06-03 12:31:55.493238	2026-06-03 12:31:55.49325	59	\N	ITI0031
1725	3	3	MAT-00797	PRINTER HP LASERJET 1020PLUS	57	36	5	23	59	3317.44	\N	Covered	\N	18	Consumable	PRINTER HP LASERJET 1020PLUS	t	f	2026-06-03 12:31:55.495583	2026-06-03 12:31:55.495592	59	\N	ITI0032
1726	3	3	MAT-00798	PRINTER HP LASERJET P1108	57	36	5	254	564	581.73	\N	Covered	\N	18	Consumable	PRINTER HP LASERJET P1108	t	f	2026-06-03 12:31:55.497687	2026-06-03 12:31:55.497696	59	\N	ITI0033
1727	3	3	MAT-00799	PRINTER HP LASERJET P1008	57	36	5	36	98	2764.6	\N	Covered	\N	18	Consumable	PRINTER HP LASERJET P1008	t	f	2026-06-03 12:31:55.499649	2026-06-03 12:31:55.499659	59	\N	ITI0034
1728	3	3	MAT-00800	PRINTER HP LASERJET M1206 NW	57	36	5	22	57	1381.3	\N	Covered	\N	18	Consumable	PRINTER HP LASERJET M1206 NW	t	f	2026-06-03 12:31:55.501594	2026-06-03 12:31:55.501603	59	\N	ITI0035
1729	3	3	MAT-00801	PRINTER HP COLOUR LASERJET 150NW	57	36	5	28	64	4929.39	\N	Covered	\N	18	Consumable	PRINTER HP COLOUR LASERJET 150NW	t	f	2026-06-03 12:31:55.503494	2026-06-03 12:31:55.503502	59	\N	ITI0036
1730	3	3	MAT-00802	PRINTER HP NEVERSTOP LASERJET 100X	57	36	5	18	49	1230.96	\N	Covered	\N	18	Consumable	PRINTER HP NEVERSTOP LASERJET 100X	t	f	2026-06-03 12:31:55.505594	2026-06-03 12:31:55.505603	59	\N	ITI0037
1731	3	3	MAT-00803	PRINTER BROTHER DCP B7500D	57	36	5	50	130	4187.62	\N	Covered	\N	18	Consumable	PRINTER BROTHER DCP B7500D	t	f	2026-06-03 12:31:55.507675	2026-06-03 12:31:55.507685	59	\N	ITI0038
1732	3	3	MAT-00804	PRINTER CANNON LBP 2900B	57	36	5	19	71	4148.05	\N	Covered	\N	18	Consumable	PRINTER CANNON LBP 2900B	t	f	2026-06-03 12:31:55.510305	2026-06-03 12:31:55.510316	59	\N	ITI0039
1733	3	3	MAT-00805	YELLOW GEL TUBES	58	38	5	35	100	1662.9	\N	Covered	\N	12	Consumable	YELLOW GEL TUBES	t	f	2026-06-03 12:31:55.512471	2026-06-03 12:31:55.512479	59	\N	LAB0001
1734	3	3	MAT-00806	BD HOLDER	58	39	5	36	144	2348.12	\N	Covered	\N	12	Consumable	BD HOLDER	t	f	2026-06-03 12:31:55.514368	2026-06-03 12:31:55.514377	59	\N	LAB0002
1735	3	3	MAT-00807	BD VACUTAINER CLOT ACTIVATOR -4ML RED	58	39	5	42	156	3710.9	\N	Covered	\N	12	Consumable	BD VACUTAINER CLOT ACTIVATOR -4ML RED	t	f	2026-06-03 12:31:55.516383	2026-06-03 12:31:55.516391	59	\N	LAB0003
1736	3	3	MAT-00808	BD VACUTAINER EDTA K2  - 3ML PURPLE	58	39	5	403	1230	689.14	\N	Covered	\N	12	Consumable	BD VACUTAINER EDTA K2  - 3ML PURPLE	t	f	2026-06-03 12:31:55.518345	2026-06-03 12:31:55.518354	59	\N	LAB0004
1737	3	3	MAT-00809	BD VACUTAINER FLOURIDE -2ML GREY	58	39	5	30	97	3249.12	\N	Covered	\N	12	Consumable	BD VACUTAINER FLOURIDE -2ML GREY	t	f	2026-06-03 12:31:55.520278	2026-06-03 12:31:55.520286	59	\N	LAB0005
1738	3	3	MAT-00810	FILTER PAPER WHITE (GOOD QUALITY)	58	41	5	34	106	3293.81	\N	Covered	\N	12	Consumable	FILTER PAPER WHITE (GOOD QUALITY)	t	f	2026-06-03 12:31:55.522404	2026-06-03 12:31:55.522413	59	\N	LAB0006
1739	3	3	MAT-00811	LABEL   50 X 25MM. 2A. 2,500NOS/ROLL FOR BARCODE PRINTER	58	41	5	38	118	2770.96	\N	Covered	\N	18	Consumable	LABEL   50 X 25MM. 2A. 2,500NOS/ROLL FOR BARCODE PRINTER	t	f	2026-06-03 12:31:55.524713	2026-06-03 12:31:55.524723	59	\N	LAB0007
1740	3	3	MAT-00812	RIBBON - 105MM X 74METERS FOR BAR CODE PRINTER	58	41	5	33	113	3407.69	\N	Covered	\N	18	Consumable	RIBBON - 105MM X 74METERS FOR BAR CODE PRINTER	t	f	2026-06-03 12:31:55.527649	2026-06-03 12:31:55.52766	59	\N	LAB0008
1741	3	3	MAT-00813	ACCESS 2 B12 - 33000	58	37	5	24	90	2265.26	\N	Covered	\N	12	Consumable	ACCESS 2 B12 - 33000	t	f	2026-06-03 12:31:55.529739	2026-06-03 12:31:55.529748	59	\N	LAB0009
1742	3	3	MAT-00814	ACCESS 2 CONTRAD 70 - 1 X 1LTR	58	37	5	28	72	2676.86	\N	Covered	\N	12	Consumable	ACCESS 2 CONTRAD 70 - 1 X 1LTR	t	f	2026-06-03 12:31:55.531881	2026-06-03 12:31:55.531889	59	\N	LAB0010
1743	3	3	MAT-00815	ACCESS 2 CONTRAD (81911)	58	37	5	45	124	2708.27	\N	Covered	\N	12	Consumable	ACCESS 2 CONTRAD (81911)	t	f	2026-06-03 12:31:55.533832	2026-06-03 12:31:55.533841	59	\N	LAB0011
1744	3	3	MAT-00816	ACCESS 2 FERRITIN	58	37	5	452	1749	683.13	\N	Covered	\N	12	Consumable	ACCESS 2 FERRITIN	t	f	2026-06-03 12:31:55.535781	2026-06-03 12:31:55.53579	59	\N	LAB0012
1745	3	3	MAT-00817	ACCESS 2 FERRITIN CALIBRATOR	58	37	5	20	54	3918.08	\N	Covered	\N	12	Consumable	ACCESS 2 FERRITIN CALIBRATOR	t	f	2026-06-03 12:31:55.537813	2026-06-03 12:31:55.537822	59	\N	LAB0013
1746	3	3	MAT-00818	ACCESS 2 FLUSHABLE VACUUM PUMP	58	37	5	138	395	970.09	\N	Covered	\N	18	Consumable	ACCESS 2 FLUSHABLE VACUUM PUMP	t	f	2026-06-03 12:31:55.539981	2026-06-03 12:31:55.53999	59	\N	LAB0014
1747	3	3	MAT-00819	ACCESS 2 FOLATE - A98032	58	37	5	50	161	3301.36	\N	Covered	\N	12	Consumable	ACCESS 2 FOLATE - A98032	t	f	2026-06-03 12:31:55.542305	2026-06-03 12:31:55.542317	59	\N	LAB0015
1748	3	3	MAT-00820	ACCESS 2 FT3 CALIBRATOR A13430	58	37	5	20	61	2426.73	\N	Covered	\N	12	Consumable	ACCESS 2 FT3 CALIBRATOR A13430	t	f	2026-06-03 12:31:55.544786	2026-06-03 12:31:55.544795	59	\N	LAB0016
1749	3	3	MAT-00821	ACCESS 2 FT3 - A13422	58	37	5	13	36	3868.47	\N	Covered	\N	12	Consumable	ACCESS 2 FT3 - A13422	t	f	2026-06-03 12:31:55.546826	2026-06-03 12:31:55.546835	59	\N	LAB0017
1750	3	3	MAT-00822	ACCESS 2 FT4 CALIBRATOR 33885	58	37	5	36	75	3358.44	\N	Covered	\N	12	Consumable	ACCESS 2 FT4 CALIBRATOR 33885	t	f	2026-06-03 12:31:55.548896	2026-06-03 12:31:55.548904	59	\N	LAB0018
1751	3	3	MAT-00823	ACCESS 2 FT4 - 33880	58	37	5	46	140	4511.82	\N	Covered	\N	12	Consumable	ACCESS 2 FT4 - 33880	t	f	2026-06-03 12:31:55.550891	2026-06-03 12:31:55.5509	59	\N	LAB0019
1752	3	3	MAT-00824	ACCESS 2 HFSH - 33520	58	37	5	11	34	4993.96	\N	Covered	\N	12	Consumable	ACCESS 2 HFSH - 33520	t	f	2026-06-03 12:31:55.552876	2026-06-03 12:31:55.552885	59	\N	LAB0020
1753	3	3	MAT-00825	ACCESS 2 HLH - 33510	58	37	5	24	61	3768	\N	Covered	\N	12	Consumable	ACCESS 2 HLH - 33510	t	f	2026-06-03 12:31:55.554972	2026-06-03 12:31:55.554982	59	\N	LAB0021
1754	3	3	MAT-00826	ACCESS 2 OV MONITOR CALIBRATOR	58	37	5	41	139	3364.01	\N	Covered	\N	12	Consumable	ACCESS 2 OV MONITOR CALIBRATOR	t	f	2026-06-03 12:31:55.557037	2026-06-03 12:31:55.557046	59	\N	LAB0022
1755	3	3	MAT-00827	ACCESS 2 OV MONITOR KIT	58	37	5	47	165	4609.87	\N	Covered	\N	12	Consumable	ACCESS 2 OV MONITOR KIT	t	f	2026-06-03 12:31:55.55977	2026-06-03 12:31:55.559782	59	\N	LAB0023
1756	3	3	MAT-00828	ACCESS 2 PROLACTIN - 33530	58	37	5	44	123	4128.09	\N	Covered	\N	12	Consumable	ACCESS 2 PROLACTIN - 33530	t	f	2026-06-03 12:31:55.562177	2026-06-03 12:31:55.562185	59	\N	LAB0024
1757	3	3	MAT-00829	ACCESS 2 PSA CALIBRATOR	58	37	5	39	114	4009.83	\N	Covered	\N	12	Consumable	ACCESS 2 PSA CALIBRATOR	t	f	2026-06-03 12:31:55.564178	2026-06-03 12:31:55.564186	59	\N	LAB0025
1758	3	3	MAT-00830	ACCESS 2 PSA HYB KIT	58	37	5	34	102	2444.38	\N	Covered	\N	12	Consumable	ACCESS 2 PSA HYB KIT	t	f	2026-06-03 12:31:55.566133	2026-06-03 12:31:55.566142	59	\N	LAB0026
1759	3	3	MAT-00831	ACCESS 2 REACTION VESSELS (81901) - 16*98	58	37	5	47	118	2010.89	\N	Covered	\N	12	Consumable	ACCESS 2 REACTION VESSELS (81901) - 16*98	t	f	2026-06-03 12:31:55.568064	2026-06-03 12:31:55.568073	59	\N	LAB0027
1760	3	3	MAT-00832	ACCESS 2 SAMPLE CUPS 0.5ML (844101030) - 1000 CUPS	58	37	5	21	65	3560.72	\N	Covered	\N	12	Consumable	ACCESS 2 SAMPLE CUPS 0.5ML (844101030) - 1000 CUPS	t	f	2026-06-03 12:31:55.570023	2026-06-03 12:31:55.570031	59	\N	LAB0028
1761	3	3	MAT-00833	ACCESS 2 SAMPLE CUPS 2ML (81902) - 1000 CUPS	58	37	5	19	62	3106.64	\N	Covered	\N	12	Consumable	ACCESS 2 SAMPLE CUPS 2ML (81902) - 1000 CUPS	t	f	2026-06-03 12:31:55.572106	2026-06-03 12:31:55.572116	59	\N	LAB0029
1762	3	3	MAT-00834	ACCESS 2 SUBSTRATE (81906) - 4*130ML	58	37	5	27	81	2645.23	\N	Covered	\N	12	Consumable	ACCESS 2 SUBSTRATE (81906) - 4*130ML	t	f	2026-06-03 12:31:55.574058	2026-06-03 12:31:55.574066	59	\N	LAB0030
1763	3	3	MAT-00835	ACCESS 2 SYSTEM CHECK SOLN - 81910	58	37	5	10	38	1511.59	\N	Covered	\N	12	Consumable	ACCESS 2 SYSTEM CHECK SOLN - 81910	t	f	2026-06-03 12:31:55.576536	2026-06-03 12:31:55.576548	59	\N	LAB0031
1764	3	3	MAT-00836	ACCESS 2 T3 - 33830	58	37	5	38	101	4216.18	\N	Covered	\N	12	Consumable	ACCESS 2 T3 - 33830	t	f	2026-06-03 12:31:55.578901	2026-06-03 12:31:55.57891	59	\N	LAB0032
1765	3	3	MAT-00837	ACCESS 2 T4 - 33800	58	37	5	19	72	2889.44	\N	Covered	\N	12	Consumable	ACCESS 2 T4 - 33800	t	f	2026-06-03 12:31:55.580909	2026-06-03 12:31:55.580917	59	\N	LAB0033
1766	3	3	MAT-00838	ACCESS 2 TOTAL B-HCG	58	37	5	34	134	3943.73	\N	Covered	\N	12	Consumable	ACCESS 2 TOTAL B-HCG	t	f	2026-06-03 12:31:55.582911	2026-06-03 12:31:55.582919	59	\N	LAB0034
1767	3	3	MAT-00839	ACCESS 2 TOTAL B-HCG CALI	58	37	5	26	71	4616.61	\N	Covered	\N	12	Consumable	ACCESS 2 TOTAL B-HCG CALI	t	f	2026-06-03 12:31:55.584918	2026-06-03 12:31:55.584927	59	\N	LAB0035
1768	3	3	MAT-00840	ACCESS 2 TOTAL T3 CALIBRATOR	58	37	5	198	613	898.66	\N	Covered	\N	12	Consumable	ACCESS 2 TOTAL T3 CALIBRATOR	t	f	2026-06-03 12:31:55.586994	2026-06-03 12:31:55.587007	59	\N	LAB0036
1769	3	3	MAT-00841	ACCESS 2 TOTAL T4 CALIBRATOR	58	37	5	35	80	4729.45	\N	Covered	\N	12	Consumable	ACCESS 2 TOTAL T4 CALIBRATOR	t	f	2026-06-03 12:31:55.589158	2026-06-03 12:31:55.589167	59	\N	LAB0037
1770	3	3	MAT-00842	ACCESS 2 TSH CALIBRATOR 33825	58	37	5	30	87	1489.17	\N	Covered	\N	12	Consumable	ACCESS 2 TSH CALIBRATOR 33825	t	f	2026-06-03 12:31:55.591281	2026-06-03 12:31:55.591291	59	\N	LAB0038
1771	3	3	MAT-00843	ACCESS 2 TSH3 CALIBRATOR - B63285	58	37	5	419	1040	621.82	\N	Covered	\N	12	Consumable	ACCESS 2 TSH3 CALIBRATOR - B63285	t	f	2026-06-03 12:31:55.593857	2026-06-03 12:31:55.593868	59	\N	LAB0039
1772	3	3	MAT-00844	ACCESS 2 TSH - 33820	58	37	5	24	64	2209.15	\N	Covered	\N	12	Consumable	ACCESS 2 TSH - 33820	t	f	2026-06-03 12:31:55.596023	2026-06-03 12:31:55.596032	59	\N	LAB0040
1773	3	3	MAT-00845	ACCESS 2 TSH3 - 63284	58	37	5	29	81	3603.04	\N	Covered	\N	12	Consumable	ACCESS 2 TSH3 - 63284	t	f	2026-06-03 12:31:55.598053	2026-06-03 12:31:55.598062	59	\N	LAB0041
1774	3	3	MAT-00846	ACCESS 2 WASH BUFFER II (A16792) - 4*1950ML	58	37	5	20	45	2311.65	\N	Covered	\N	12	Consumable	ACCESS 2 WASH BUFFER II (A16792) - 4*1950ML	t	f	2026-06-03 12:31:55.600051	2026-06-03 12:31:55.60006	59	\N	LAB0042
1775	3	3	MAT-00847	ACCESS 2 WASTE BAG (81904) - 20/BOX	58	37	5	15	60	2793.07	\N	Covered	\N	18	Consumable	ACCESS 2 WASTE BAG (81904) - 20/BOX	t	f	2026-06-03 12:31:55.602024	2026-06-03 12:31:55.602033	59	\N	LAB0043
1776	3	3	MAT-00848	ACCESS 25 OH VIT D - B24838	58	37	5	33	129	1492.31	\N	Covered	\N	12	Consumable	ACCESS 25 OH VIT D - B24838	t	f	2026-06-03 12:31:55.604034	2026-06-03 12:31:55.604042	59	\N	LAB0044
1777	3	3	MAT-00849	ACCESS 25-OH VIT D CALIBRATOR - B24839	58	37	5	17	36	2499.05	\N	Covered	\N	12	Consumable	ACCESS 25-OH VIT D CALIBRATOR - B24839	t	f	2026-06-03 12:31:55.606207	2026-06-03 12:31:55.606216	59	\N	LAB0045
1778	3	3	MAT-00850	ACCESS B12 CALS 33005	58	37	5	33	129	2532.7	\N	Covered	\N	12	Consumable	ACCESS B12 CALS 33005	t	f	2026-06-03 12:31:55.60832	2026-06-03 12:31:55.608331	59	\N	LAB0046
1779	3	3	MAT-00851	ACCESS CONTROL DEVICE-COSEC FOP	58	37	5	18	62	4752.4	\N	Covered	\N	18	Non-Consumable	ACCESS CONTROL DEVICE-COSEC FOP	t	f	2026-06-03 12:31:55.610947	2026-06-03 12:31:55.610957	59	\N	LAB0047
1780	3	3	MAT-00852	ACCESS CONTROL DEVICE - ELECTRO MAGNETIC DOOR LOCK	58	37	5	28	58	2535.35	\N	Covered	\N	18	Non-Consumable	ACCESS CONTROL DEVICE - ELECTRO MAGNETIC DOOR LOCK	t	f	2026-06-03 12:31:55.613051	2026-06-03 12:31:55.613059	59	\N	LAB0048
1781	3	3	MAT-00853	ACCESS CONTROL DEVICE - EXIT SWITCH	58	37	5	21	68	2265.87	\N	Covered	\N	18	Non-Consumable	ACCESS CONTROL DEVICE - EXIT SWITCH	t	f	2026-06-03 12:31:55.614939	2026-06-03 12:31:55.614947	59	\N	LAB0049
1782	3	3	MAT-00854	ACCESS CONTROL DEVICE - L/U ANGLE	58	37	5	38	117	4770.71	\N	Covered	\N	18	Non-Consumable	ACCESS CONTROL DEVICE - L/U ANGLE	t	f	2026-06-03 12:31:55.616939	2026-06-03 12:31:55.616948	59	\N	LAB0050
1783	3	3	MAT-00855	ACCESS FOLATE CALIBRATOR - A98033	58	37	5	399	1227	626.33	\N	Covered	\N	12	Consumable	ACCESS FOLATE CALIBRATOR - A98033	t	f	2026-06-03 12:31:55.618924	2026-06-03 12:31:55.618932	59	\N	LAB0051
1784	3	3	MAT-00856	ACCESS FSH CALIBRATOR - 33525	58	37	5	27	62	3881.03	\N	Covered	\N	12	Consumable	ACCESS FSH CALIBRATOR - 33525	t	f	2026-06-03 12:31:55.620903	2026-06-03 12:31:55.620912	59	\N	LAB0052
1785	3	3	MAT-00857	ACCESS HFSH 33520	58	37	5	33	124	3070.82	\N	Covered	\N	12	Consumable	ACCESS HFSH 33520	t	f	2026-06-03 12:31:55.622955	2026-06-03 12:31:55.622964	59	\N	LAB0053
1786	3	3	MAT-00858	ACCESS LH CALIBRATOR - 33515	58	37	5	50	126	2624.16	\N	Covered	\N	12	Consumable	ACCESS LH CALIBRATOR - 33515	t	f	2026-06-03 12:31:55.625157	2026-06-03 12:31:55.625168	59	\N	LAB0054
1787	3	3	MAT-00859	ACCESS PROLACTIN CALIBRATOR - 33535	58	37	5	30	100	3958.76	\N	Covered	\N	5	Non-Consumable	ACCESS PROLACTIN CALIBRATOR - 33535	t	f	2026-06-03 12:31:55.627817	2026-06-03 12:31:55.627827	59	\N	LAB0055
1788	3	3	MAT-00860	ACCESSORIES FOR PENDANTS - AIR 7  SOCKETS	58	37	5	24	53	3325.98	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS - AIR 7  SOCKETS	t	f	2026-06-03 12:31:55.629888	2026-06-03 12:31:55.629896	59	\N	LAB0056
1789	3	3	MAT-00861	ACCESSORIES FOR PENDANTS - CARBON DIOXIDE COUPLER	58	37	5	23	62	2816.47	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS - CARBON DIOXIDE COUPLER	t	f	2026-06-03 12:31:55.631957	2026-06-03 12:31:55.631966	59	\N	LAB0057
1790	3	3	MAT-00862	ACCESSORIES FOR PENDANTS - NITROUS OXIDE COUPLER	58	37	5	355	1111	554.65	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS - NITROUS OXIDE COUPLER	t	f	2026-06-03 12:31:55.633967	2026-06-03 12:31:55.633976	59	\N	LAB0058
1791	3	3	MAT-00863	ACCESSORIES FOR PENDANTS - TRAY	58	37	5	16	54	2561.95	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS - TRAY	t	f	2026-06-03 12:31:55.635992	2026-06-03 12:31:55.636001	59	\N	LAB0059
1792	3	3	MAT-00864	ACCESSORIES FOR PENDANTS - TRAY WITH SHELF	58	37	5	10	35	1563.11	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS - TRAY WITH SHELF	t	f	2026-06-03 12:31:55.638038	2026-06-03 12:31:55.638047	59	\N	LAB0060
1793	3	3	MAT-00865	ACCESSORIES FOR PENDANTS - VACUUM SOCKET	58	37	5	36	141	1211.86	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS - VACUUM SOCKET	t	f	2026-06-03 12:31:55.640225	2026-06-03 12:31:55.640234	59	\N	LAB0061
1794	3	3	MAT-00866	ACCESSORIES FOR PENDANTS- OXYGENERAL COUPLER	58	37	5	23	86	4756.85	\N	Covered	\N	5	Non-Consumable	ACCESSORIES FOR PENDANTS- OXYGENERAL COUPLER	t	f	2026-06-03 12:31:55.642494	2026-06-03 12:31:55.642506	59	\N	LAB0062
1795	3	3	MAT-00867	ASSAYED CHEMISTRY CONTROLS - LEVEL-1 (12X5ML)	58	37	5	30	71	2143.12	\N	Covered	\N	5	Consumable	ASSAYED CHEMISTRY CONTROLS - LEVEL-1 (12X5ML)	t	f	2026-06-03 12:31:55.645085	2026-06-03 12:31:55.645095	59	\N	LAB0063
1796	3	3	MAT-00868	ASSAYED CHEMISTRY CONTROLS -LEVEL 2 (12X5ML)	58	37	5	44	170	1730.8	\N	Covered	\N	5	Consumable	ASSAYED CHEMISTRY CONTROLS -LEVEL 2 (12X5ML)	t	f	2026-06-03 12:31:55.647362	2026-06-03 12:31:55.647371	59	\N	LAB0064
1797	3	3	MAT-00869	BIO CHEMISTRY REGISTER	58	37	5	262	996	733.5	\N	Covered	\N	5	Consumable	BIO CHEMISTRY REGISTER	t	f	2026-06-03 12:31:55.649593	2026-06-03 12:31:55.649602	59	\N	LAB0065
1798	3	3	MAT-00870	STANDARD F CRP 20T	58	37	5	41	152	2333.08	\N	Covered	\N	5	Consumable	STANDARD F CRP 20T	t	f	2026-06-03 12:31:55.651894	2026-06-03 12:31:55.651903	59	\N	LAB0066
1799	3	3	MAT-00871	STANDARD F D. DIMER 20T	58	40	5	22	64	1780.72	\N	Covered	\N	5	Consumable	STANDARD F D. DIMER 20T	t	f	2026-06-03 12:31:55.654304	2026-06-03 12:31:55.654316	59	\N	LAB0067
1800	3	3	MAT-00872	STANDARD F HBA1C 20T	58	37	5	32	110	3973.15	\N	Covered	\N	5	Consumable	STANDARD F HBA1C 20T	t	f	2026-06-03 12:31:55.656679	2026-06-03 12:31:55.656688	59	\N	LAB0068
1801	3	3	MAT-00873	STANDARD F NT_PRO BNP 20T	58	37	5	40	89	1643.63	\N	Covered	\N	5	Consumable	STANDARD F NT_PRO BNP 20T	t	f	2026-06-03 12:31:55.658962	2026-06-03 12:31:55.658973	59	\N	LAB0069
1802	3	3	MAT-00874	TROPININ I 20TEST	58	37	5	359	1131	948.35	\N	Covered	\N	5	Consumable	TROPININ I 20TEST	t	f	2026-06-03 12:31:55.661614	2026-06-03 12:31:55.661624	59	\N	LAB0070
1803	3	3	MAT-00875	TROPONIN I 10 TEST	58	37	5	35	114	1413.31	\N	Covered	\N	5	Consumable	TROPONIN I 10 TEST	t	f	2026-06-03 12:31:55.663668	2026-06-03 12:31:55.663677	59	\N	LAB0071
1804	3	3	MAT-00876	TUMOR MRKR CNT LVL 1 6X2 ML	58	37	5	12	38	3703.44	\N	Covered	\N	5	Consumable	TUMOR MRKR CNT LVL 1 6X2 ML	t	f	2026-06-03 12:31:55.665682	2026-06-03 12:31:55.665691	59	\N	LAB0072
1805	3	3	MAT-00877	TUMOR MRKR CNT LVL 2 6X2 ML	58	37	5	26	94	2147.61	\N	Covered	\N	5	Consumable	TUMOR MRKR CNT LVL 2 6X2 ML	t	f	2026-06-03 12:31:55.667657	2026-06-03 12:31:55.667666	59	\N	LAB0073
1806	3	3	MAT-00878	TUMOR MRKR CNT LVL 3 6X2 ML	58	37	5	20	52	3382.47	\N	Covered	\N	5	Consumable	TUMOR MRKR CNT LVL 3 6X2 ML	t	f	2026-06-03 12:31:55.669623	2026-06-03 12:31:55.669631	59	\N	LAB0074
1807	3	3	MAT-00879	VITROS 4600 - CAL KIT 33	58	37	5	40	142	4743.54	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 33	t	f	2026-06-03 12:31:55.671564	2026-06-03 12:31:55.671574	59	\N	LAB0075
1808	3	3	MAT-00880	VITROS 4600 - CAL KIT 8	58	37	5	30	108	2781.01	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 8	t	f	2026-06-03 12:31:55.673666	2026-06-03 12:31:55.673675	59	\N	LAB0076
1809	3	3	MAT-00881	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 1	58	37	5	31	110	1307.76	\N	Covered	\N	5	Consumable	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 1	t	f	2026-06-03 12:31:55.676121	2026-06-03 12:31:55.676133	59	\N	LAB0077
1810	3	3	MAT-00882	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 2	58	37	5	43	100	1699.39	\N	Covered	\N	5	Consumable	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 2	t	f	2026-06-03 12:31:55.678815	2026-06-03 12:31:55.678825	59	\N	LAB0078
1811	3	3	MAT-00883	CALCIUM CHLORIDE (0.025 MOL/L) 15MLX10	58	43	5	31	73	1931.87	\N	Covered	\N	5	Consumable	CALCIUM CHLORIDE (0.025 MOL/L) 15MLX10	t	f	2026-06-03 12:31:55.680871	2026-06-03 12:31:55.680879	59	\N	LAB0079
1812	3	3	MAT-00884	COBAS 411 - CONTROL TEST M- 1BOX/50STRIPS	58	43	5	43	140	3175.82	\N	Covered	\N	5	Consumable	COBAS 411 - CONTROL TEST M- 1BOX/50STRIPS	t	f	2026-06-03 12:31:55.682863	2026-06-03 12:31:55.682872	59	\N	LAB0080
1813	3	3	MAT-00885	COBAS COMBUR 10 M URINE TEST (100 NOS)	58	43	5	39	88	3781.11	\N	Covered	\N	5	Consumable	COBAS COMBUR 10 M URINE TEST (100 NOS)	t	f	2026-06-03 12:31:55.684832	2026-06-03 12:31:55.68484	59	\N	LAB0081
1814	3	3	MAT-00886	CUVETTE FL 100X5	58	43	5	34	121	1189.58	\N	Covered	\N	5	Consumable	CUVETTE FL 100X5	t	f	2026-06-03 12:31:55.686806	2026-06-03 12:31:55.686814	59	\N	LAB0082
1815	3	3	MAT-00887	COBAS URINE ANALYZER THERMAL PAPER 110MM ROLL	58	43	5	34	82	3992.91	\N	Covered	\N	18	Consumable	COBAS URINE ANALYZER THERMAL PAPER 110MM ROLL	t	f	2026-06-03 12:31:55.688905	2026-06-03 12:31:55.688914	59	\N	LAB0083
1816	3	3	MAT-00888	ERBA H7 HIGH (1X3ML) CAT NO: HEM00058-195114	58	43	5	34	128	4768.65	\N	Covered	\N	5	Consumable	ERBA H7 HIGH (1X3ML) CAT NO: HEM00058-195114	t	f	2026-06-03 12:31:55.69104	2026-06-03 12:31:55.691049	59	\N	LAB0084
1817	3	3	MAT-00889	ERBA H7 LOW (1X3ML) CAT NO: HEM00056-195112	58	43	5	24	59	3435.11	\N	Covered	\N	5	Consumable	ERBA H7 LOW (1X3ML) CAT NO: HEM00056-195112	t	f	2026-06-03 12:31:55.693544	2026-06-03 12:31:55.693556	59	\N	LAB0085
1818	3	3	MAT-00890	ERBA H7 NORM (1X3ML) CAT NO: HEM00057-195113	58	43	5	20	42	3857.03	\N	Covered	\N	5	Consumable	ERBA H7 NORM (1X3ML) CAT NO: HEM00057-195113	t	f	2026-06-03 12:31:55.695904	2026-06-03 12:31:55.695913	59	\N	LAB0086
1819	3	3	MAT-00891	ESR PIPETTES - HELICO - PACK OF 200	58	43	5	17	68	4091.43	\N	Covered	\N	5	Consumable	ESR PIPETTES - HELICO - PACK OF 200	t	f	2026-06-03 12:31:55.69797	2026-06-03 12:31:55.697979	59	\N	LAB0087
1820	3	3	MAT-00892	ESR SODIUM CITRATE 3.8% TUBES(VACUTAINERS) WITH BLACK CAP	58	43	5	18	62	3485.09	\N	Covered	\N	5	Consumable	ESR SODIUM CITRATE 3.8% TUBES(VACUTAINERS) WITH BLACK CAP	t	f	2026-06-03 12:31:55.699962	2026-06-03 12:31:55.699971	59	\N	LAB0088
1821	3	3	MAT-00893	H360 - DILUENT - 121740 - 20LTRS	58	43	5	18	37	4603.24	\N	Covered	\N	5	Consumable	H360 - DILUENT - 121740 - 20LTRS	t	f	2026-06-03 12:31:55.701938	2026-06-03 12:31:55.701946	59	\N	LAB0089
1822	3	3	MAT-00894	H360 - LYSE  - 121741 - 1500ML	58	43	5	328	1132	717.26	\N	Covered	\N	5	Consumable	H360 - LYSE  - 121741 - 1500ML	t	f	2026-06-03 12:31:55.703939	2026-06-03 12:31:55.703948	59	\N	LAB0090
1823	3	3	MAT-00895	HEMOSPOT (CANCHECK) - TULIP	58	43	5	23	86	4292.77	\N	Covered	\N	5	Consumable	HEMOSPOT (CANCHECK) - TULIP	t	f	2026-06-03 12:31:55.706068	2026-06-03 12:31:55.706077	59	\N	LAB0091
1824	3	3	MAT-00896	LEISHMAN STAIN 500ML	58	43	5	38	143	4303.11	\N	Covered	\N	5	Consumable	LEISHMAN STAIN 500ML	t	f	2026-06-03 12:31:55.708149	2026-06-03 12:31:55.708159	59	\N	LAB0092
1825	3	3	MAT-00897	VITROS - VERSA TIP BOX	58	37	5	49	111	1481.82	\N	Covered	\N	5	Consumable	VITROS - VERSA TIP BOX	t	f	2026-06-03 12:31:55.710763	2026-06-03 12:31:55.710774	59	\N	LAB0093
1826	3	3	MAT-00898	VITROS 4600 - ALBUMIN PACK SIZE 18	58	37	5	50	149	1988.56	\N	Covered	\N	5	Consumable	VITROS 4600 - ALBUMIN PACK SIZE 18	t	f	2026-06-03 12:31:55.713069	2026-06-03 12:31:55.713078	59	\N	LAB0094
1827	3	3	MAT-00899	VITROS 4600 - ALBUMIN PACK SIZE 50	58	37	5	28	109	4423.62	\N	Covered	\N	5	Consumable	VITROS 4600 - ALBUMIN PACK SIZE 50	t	f	2026-06-03 12:31:55.715121	2026-06-03 12:31:55.71513	59	\N	LAB0095
1828	3	3	MAT-00900	VITROS 4600 - ALCOHOL (18 TEST PACK)	58	37	5	28	79	4476.08	\N	Covered	\N	5	Consumable	VITROS 4600 - ALCOHOL (18 TEST PACK)	t	f	2026-06-03 12:31:55.717069	2026-06-03 12:31:55.717084	59	\N	LAB0096
1829	3	3	MAT-00901	VITROS 4600 - ALKP PACK SIZE 60	58	37	5	30	112	1647.76	\N	Covered	\N	5	Consumable	VITROS 4600 - ALKP PACK SIZE 60	t	f	2026-06-03 12:31:55.718997	2026-06-03 12:31:55.719005	59	\N	LAB0097
1830	3	3	MAT-00902	VITROS 4600 - ALTV/SGPT PACK SIZE 60	58	37	5	35	107	2882.93	\N	Covered	\N	5	Consumable	VITROS 4600 - ALTV/SGPT PACK SIZE 60	t	f	2026-06-03 12:31:55.720959	2026-06-03 12:31:55.720968	59	\N	LAB0098
1831	3	3	MAT-00903	VITROS 4600 - AMYLASE PACK SIZE 18	58	37	5	12	28	1499.07	\N	Covered	\N	5	Consumable	VITROS 4600 - AMYLASE PACK SIZE 18	t	f	2026-06-03 12:31:55.723275	2026-06-03 12:31:55.723285	59	\N	LAB0099
1832	3	3	MAT-00904	VITROS 4600 - AMYLASE PACK SIZE 60	58	37	5	50	160	2913.82	\N	Covered	\N	5	Consumable	VITROS 4600 - AMYLASE PACK SIZE 60	t	f	2026-06-03 12:31:55.725428	2026-06-03 12:31:55.725438	59	\N	LAB0100
1833	3	3	MAT-00905	VITROS 4600 - AST/SGOT PACK SIZE 60	58	37	5	33	111	1970.46	\N	Covered	\N	5	Consumable	VITROS 4600 - AST/SGOT PACK SIZE 60	t	f	2026-06-03 12:31:55.728059	2026-06-03 12:31:55.728069	59	\N	LAB0101
1834	3	3	MAT-00906	VITROS 4600 - BUBC PACK SIZE 18	58	37	5	18	50	2329.45	\N	Covered	\N	5	Consumable	VITROS 4600 - BUBC PACK SIZE 18	t	f	2026-06-03 12:31:55.73018	2026-06-03 12:31:55.730189	59	\N	LAB0102
1835	3	3	MAT-00907	VITROS 4600 - BUBC PACK SIZE 60	58	37	5	44	123	2871.67	\N	Covered	\N	5	Consumable	VITROS 4600 - BUBC PACK SIZE 60	t	f	2026-06-03 12:31:55.732196	2026-06-03 12:31:55.732204	59	\N	LAB0103
1836	3	3	MAT-00908	VITROS 4600 - CAL KIT 1	58	37	5	32	106	4472.57	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 1	t	f	2026-06-03 12:31:55.734165	2026-06-03 12:31:55.734173	59	\N	LAB0104
1837	3	3	MAT-00909	VITROS 4600 - CAL KIT 10	58	37	5	27	102	1755.17	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 10	t	f	2026-06-03 12:31:55.736103	2026-06-03 12:31:55.736111	59	\N	LAB0105
1838	3	3	MAT-00910	VITROS 4600 - CAL KIT 19	58	37	5	42	165	4131.25	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 19	t	f	2026-06-03 12:31:55.738021	2026-06-03 12:31:55.73803	59	\N	LAB0106
1839	3	3	MAT-00911	VITROS 4600 - CAL KIT 2	58	37	5	25	85	4111.87	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 2	t	f	2026-06-03 12:31:55.740215	2026-06-03 12:31:55.740224	59	\N	LAB0107
1840	3	3	MAT-00912	VITROS 4600 - CAL KIT 20	58	37	5	184	723	642.92	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 20	t	f	2026-06-03 12:31:55.742482	2026-06-03 12:31:55.742493	59	\N	LAB0108
1841	3	3	MAT-00913	VITROS 4600 - CAL KIT 24	58	37	5	20	47	4824.37	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 24	t	f	2026-06-03 12:31:55.745094	2026-06-03 12:31:55.745104	59	\N	LAB0109
1842	3	3	MAT-00914	VITROS 4600 - CAL KIT 25	58	37	5	329	1001	612.6	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 25	t	f	2026-06-03 12:31:55.747198	2026-06-03 12:31:55.747206	59	\N	LAB0110
1843	3	3	MAT-00915	VITROS 4600 - CAL KIT 29	58	37	5	11	41	1286.92	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 29	t	f	2026-06-03 12:31:55.749245	2026-06-03 12:31:55.749253	59	\N	LAB0111
1844	3	3	MAT-00916	VITROS 4600 - CAL KIT 3	58	37	5	34	110	3975.39	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 3	t	f	2026-06-03 12:31:55.751253	2026-06-03 12:31:55.751261	59	\N	LAB0112
1845	3	3	MAT-00917	VITROS 4600 - CAL KIT 33	58	37	5	41	88	3443.43	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 33	t	f	2026-06-03 12:31:55.753175	2026-06-03 12:31:55.753183	59	\N	LAB0113
1846	3	3	MAT-00918	VITROS 4600 - CAL KIT 4	58	37	5	32	67	4145.79	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 4	t	f	2026-06-03 12:31:55.755149	2026-06-03 12:31:55.755158	59	\N	LAB0114
1847	3	3	MAT-00919	VITROS 4600 - CAL KIT 5	58	37	5	28	62	1474.13	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 5	t	f	2026-06-03 12:31:55.757287	2026-06-03 12:31:55.757295	59	\N	LAB0115
1848	3	3	MAT-00920	VITROS 4600 - CAL KIT 7	58	37	5	30	62	1650.9	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 7	t	f	2026-06-03 12:31:55.759437	2026-06-03 12:31:55.759449	59	\N	LAB0116
1849	3	3	MAT-00921	VITROS 4600 - CAL KIT 8	58	37	5	12	32	2597.68	\N	Covered	\N	5	Consumable	VITROS 4600 - CAL KIT 8	t	f	2026-06-03 12:31:55.762017	2026-06-03 12:31:55.762026	59	\N	LAB0117
1850	3	3	MAT-00922	VITROS 4600 - CALCIUM PACK SIZE 60	58	37	5	28	103	4653.42	\N	Covered	\N	5	Consumable	VITROS 4600 - CALCIUM PACK SIZE 60	t	f	2026-06-03 12:31:55.764268	2026-06-03 12:31:55.764277	59	\N	LAB0118
1851	3	3	MAT-00923	VITROS 4600 - CHLORIDE PACK SIZE 50	58	37	5	290	964	571.12	\N	Covered	\N	5	Consumable	VITROS 4600 - CHLORIDE PACK SIZE 50	t	f	2026-06-03 12:31:55.766282	2026-06-03 12:31:55.766291	59	\N	LAB0119
1852	3	3	MAT-00924	VITROS 4600 - CHOLESTEROL PACK SIZE 60	58	37	5	42	110	1076.11	\N	Covered	\N	5	Consumable	VITROS 4600 - CHOLESTEROL PACK SIZE 60	t	f	2026-06-03 12:31:55.768316	2026-06-03 12:31:55.768325	59	\N	LAB0120
1853	3	3	MAT-00925	VITROS 4600 - CONTROLS - CRP PV1	58	37	5	42	95	4479.33	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - CRP PV1	t	f	2026-06-03 12:31:55.770273	2026-06-03 12:31:55.770281	59	\N	LAB0121
1854	3	3	MAT-00926	VITROS 4600 - CONTROLS - CRP PV2	58	37	5	42	93	3406.39	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - CRP PV2	t	f	2026-06-03 12:31:55.772294	2026-06-03 12:31:55.772303	59	\N	LAB0122
1855	3	3	MAT-00927	VITROS 4600 - CONTROLS - DIRECT TIBC - PV1	58	37	5	14	39	2491.82	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - DIRECT TIBC - PV1	t	f	2026-06-03 12:31:55.774348	2026-06-03 12:31:55.774357	59	\N	LAB0123
1856	3	3	MAT-00928	VITROS 4600 - CONTROLS - DIRECT TIBC - PV2	58	37	5	10	37	1414.21	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - DIRECT TIBC - PV2	t	f	2026-06-03 12:31:55.776706	2026-06-03 12:31:55.776718	59	\N	LAB0124
1857	3	3	MAT-00929	VITROS 4600 - CONTROLS - MICRO ALB - PV1	58	37	5	168	628	676.63	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - MICRO ALB - PV1	t	f	2026-06-03 12:31:55.779223	2026-06-03 12:31:55.779232	59	\N	LAB0125
1858	3	3	MAT-00930	VITROS 4600 - CONTROLS - MICRO ALB - PV2	58	37	5	19	59	1701.51	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - MICRO ALB - PV2	t	f	2026-06-03 12:31:55.781285	2026-06-03 12:31:55.781293	59	\N	LAB0126
1859	3	3	MAT-00931	VITROS 4600 - CONTROLS - PROTEIN - PV1	58	37	5	22	47	1119	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - PROTEIN - PV1	t	f	2026-06-03 12:31:55.783268	2026-06-03 12:31:55.783277	59	\N	LAB0127
1860	3	3	MAT-00932	VITROS 4600 - CONTROLS - PROTEIN - PV2	58	37	5	22	88	2688.1	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - PROTEIN - PV2	t	f	2026-06-03 12:31:55.785181	2026-06-03 12:31:55.785189	59	\N	LAB0128
1861	3	3	MAT-00933	VITROS 4600 - CONTROLS - PV1	58	37	5	19	40	4339.28	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - PV1	t	f	2026-06-03 12:31:55.787105	2026-06-03 12:31:55.787114	59	\N	LAB0129
1862	3	3	MAT-00934	VITROS 4600 - CONTROLS - PV2	58	37	5	22	50	2846.35	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - PV2	t	f	2026-06-03 12:31:55.789152	2026-06-03 12:31:55.789161	59	\N	LAB0130
1863	3	3	MAT-00935	VITROS 4600 - CONTROLS - UPRO- PV1	58	37	5	16	43	4239.76	\N	Covered	\N	5	Consumable	VITROS 4600 - CONTROLS - UPRO- PV1	t	f	2026-06-03 12:31:55.791166	2026-06-03 12:31:55.791175	59	\N	LAB0131
1864	3	3	MAT-00936	VITROS 4600 - CREATININE PACK SIZE 60	58	37	5	44	168	4923.44	\N	Covered	\N	5	Consumable	VITROS 4600 - CREATININE PACK SIZE 60	t	f	2026-06-03 12:31:55.793484	2026-06-03 12:31:55.793496	59	\N	LAB0132
1865	3	3	MAT-00937	VITROS 4600 - CRP PACK SIZE 18	58	37	5	50	109	2240.35	\N	Covered	\N	5	Consumable	VITROS 4600 - CRP PACK SIZE 18	t	f	2026-06-03 12:31:55.795937	2026-06-03 12:31:55.795946	59	\N	LAB0133
1866	3	3	MAT-00938	VITROS 4600 - CRP PACK SIZE 50	58	37	5	16	44	2747.05	\N	Covered	\N	5	Consumable	VITROS 4600 - CRP PACK SIZE 50	t	f	2026-06-03 12:31:55.798003	2026-06-03 12:31:55.798012	59	\N	LAB0134
1867	3	3	MAT-00939	VITROS 4600 - DESSICANT PACK	58	37	5	27	72	2086.9	\N	Covered	\N	18	Consumable	VITROS 4600 - DESSICANT PACK	t	f	2026-06-03 12:31:55.800051	2026-06-03 12:31:55.80006	59	\N	LAB0135
1868	3	3	MAT-00940	VITROS 4600 - DIRECT HDL PACK SIZE 60	58	37	5	34	120	3949.3	\N	Covered	\N	5	Consumable	VITROS 4600 - DIRECT HDL PACK SIZE 60	t	f	2026-06-03 12:31:55.802057	2026-06-03 12:31:55.802065	59	\N	LAB0136
1869	3	3	MAT-00941	VITROS 4600 - DIRECT LDL PACK SIZE 100	58	37	5	49	192	1652.95	\N	Covered	\N	5	Consumable	VITROS 4600 - DIRECT LDL PACK SIZE 100	t	f	2026-06-03 12:31:55.804041	2026-06-03 12:31:55.80405	59	\N	LAB0137
1870	3	3	MAT-00942	VITROS 4600 - DIRECT TIBC PACK SIZE 50	58	37	5	23	48	2950.7	\N	Covered	\N	5	Consumable	VITROS 4600 - DIRECT TIBC PACK SIZE 50	t	f	2026-06-03 12:31:55.806118	2026-06-03 12:31:55.806127	59	\N	LAB0138
1871	3	3	MAT-00943	VITROS 4600 - DTIBC PERF VER1	58	37	5	37	93	2455.01	\N	Covered	\N	5	Consumable	VITROS 4600 - DTIBC PERF VER1	t	f	2026-06-03 12:31:55.808211	2026-06-03 12:31:55.80822	59	\N	LAB0139
1872	3	3	MAT-00944	VITROS 4600 - DTIBC PERF VER2	58	37	5	24	70	1058.42	\N	Covered	\N	5	Consumable	VITROS 4600 - DTIBC PERF VER2	t	f	2026-06-03 12:31:55.810779	2026-06-03 12:31:55.810791	59	\N	LAB0140
1873	3	3	MAT-00945	VITROS 4600 - ERF800	58	37	5	37	127	4356.33	\N	Covered	\N	5	Consumable	VITROS 4600 - ERF800	t	f	2026-06-03 12:31:55.813125	2026-06-03 12:31:55.813134	59	\N	LAB0141
1874	3	3	MAT-00946	VITROS 4600 - FS CAL 1	58	37	5	35	134	2920.67	\N	Covered	\N	5	Consumable	VITROS 4600 - FS CAL 1	t	f	2026-06-03 12:31:55.815156	2026-06-03 12:31:55.815165	59	\N	LAB0142
1875	3	3	MAT-00947	VITROS 4600 - FS CUVETTE	58	37	5	42	103	4214.44	\N	Covered	\N	5	Consumable	VITROS 4600 - FS CUVETTE	t	f	2026-06-03 12:31:55.817143	2026-06-03 12:31:55.817152	59	\N	LAB0143
1876	3	3	MAT-00948	VITROS 4600 - FS DILUENT 1	58	37	5	45	114	2380.12	\N	Covered	\N	5	Consumable	VITROS 4600 - FS DILUENT 1	t	f	2026-06-03 12:31:55.819049	2026-06-03 12:31:55.819059	59	\N	LAB0144
1877	3	3	MAT-00949	VITROS 4600 - FS DILUENT 2	58	37	5	33	88	4477.12	\N	Covered	\N	5	Consumable	VITROS 4600 - FS DILUENT 2	t	f	2026-06-03 12:31:55.820984	2026-06-03 12:31:55.820992	59	\N	LAB0145
1878	3	3	MAT-00950	VITROS 4600 - FS DILUENT 3	58	37	5	28	91	2626.99	\N	Covered	\N	5	Consumable	VITROS 4600 - FS DILUENT 3	t	f	2026-06-03 12:31:55.823066	2026-06-03 12:31:55.823075	59	\N	LAB0146
1879	3	3	MAT-00951	VITROS 4600 - FS HUMIDIFICATION PACK	58	37	5	390	1294	524.33	\N	Covered	\N	5	Consumable	VITROS 4600 - FS HUMIDIFICATION PACK	t	f	2026-06-03 12:31:55.825149	2026-06-03 12:31:55.825159	59	\N	LAB0147
1880	3	3	MAT-00952	VITROS 4600 - FS RECONSTITUTION DILUENT	58	37	5	20	62	2120.34	\N	Covered	\N	5	Consumable	VITROS 4600 - FS RECONSTITUTION DILUENT	t	f	2026-06-03 12:31:55.827778	2026-06-03 12:31:55.827789	59	\N	LAB0148
1881	3	3	MAT-00953	VITROS 4600 - FS-MICROTIPS	58	37	5	50	158	4286.82	\N	Covered	\N	18	Consumable	VITROS 4600 - FS-MICROTIPS	t	f	2026-06-03 12:31:55.830066	2026-06-03 12:31:55.830074	59	\N	LAB0149
1882	3	3	MAT-00954	VITROS 4600 - GLUCOSE PACK SIZE 60	58	37	5	11	30	1000.09	\N	Covered	\N	5	Consumable	VITROS 4600 - GLUCOSE PACK SIZE 60	t	f	2026-06-03 12:31:55.832128	2026-06-03 12:31:55.832136	59	\N	LAB0150
1883	3	3	MAT-00955	VITROS 4600 - IRON (FE) PACK SIZE 18	58	37	5	48	101	1678.56	\N	Covered	\N	5	Consumable	VITROS 4600 - IRON (FE) PACK SIZE 18	t	f	2026-06-03 12:31:55.834094	2026-06-03 12:31:55.834103	59	\N	LAB0151
1884	3	3	MAT-00956	VITROS 4600 - IRON PACK SIZE 18	58	37	5	42	140	2235.21	\N	Covered	\N	5	Consumable	VITROS 4600 - IRON PACK SIZE 18	t	f	2026-06-03 12:31:55.836029	2026-06-03 12:31:55.836038	59	\N	LAB0152
1885	3	3	MAT-00957	VITROS 4600 - IRON PACK SIZE 60	58	37	5	216	689	949.57	\N	Covered	\N	5	Consumable	VITROS 4600 - IRON PACK SIZE 60	t	f	2026-06-03 12:31:55.837995	2026-06-03 12:31:55.838004	59	\N	LAB0153
1886	3	3	MAT-00958	VITROS 4600 - IWF	58	37	5	47	102	1164.45	\N	Covered	\N	5	Consumable	VITROS 4600 - IWF	t	f	2026-06-03 12:31:55.840127	2026-06-03 12:31:55.840136	59	\N	LAB0154
1887	3	3	MAT-00959	VITROS 4600 - LAMP ASSEMBLY	58	37	5	123	382	972.59	\N	Covered	\N	18	Consumable	VITROS 4600 - LAMP ASSEMBLY	t	f	2026-06-03 12:31:55.842322	2026-06-03 12:31:55.842333	59	\N	LAB0155
1888	3	3	MAT-00960	VITROS 4600 - LIPASE PACK SIZE 18	58	37	5	38	131	4616.44	\N	Covered	\N	5	Consumable	VITROS 4600 - LIPASE PACK SIZE 18	t	f	2026-06-03 12:31:55.844983	2026-06-03 12:31:55.844994	59	\N	LAB0156
1889	3	3	MAT-00961	VITROS 4600 - LIPASE PACK SIZE 50	58	37	5	14	52	1182.39	\N	Covered	\N	5	Consumable	VITROS 4600 - LIPASE PACK SIZE 50	t	f	2026-06-03 12:31:55.847211	2026-06-03 12:31:55.84722	59	\N	LAB0157
1890	3	3	MAT-00962	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 1	58	37	5	47	137	4529.76	\N	Covered	\N	5	Consumable	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 1	t	f	2026-06-03 12:31:55.849264	2026-06-03 12:31:55.849273	59	\N	LAB0158
1891	3	3	MAT-00963	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 2	58	37	5	48	150	4194.59	\N	Covered	\N	5	Consumable	VITROS 4600 - LIQUID PERFORMANCE VERIFIER 2	t	f	2026-06-03 12:31:55.851279	2026-06-03 12:31:55.851288	59	\N	LAB0159
1892	3	3	MAT-00964	VITROS 4600 - LITHIUM PACK SIZE 18	58	37	5	48	139	1981.54	\N	Covered	\N	5	Consumable	VITROS 4600 - LITHIUM PACK SIZE 18	t	f	2026-06-03 12:31:55.853298	2026-06-03 12:31:55.853307	59	\N	LAB0160
1893	3	3	MAT-00965	VITROS 4600 - MAGNESIUM PACK SIZE 18	58	37	5	24	49	3686.8	\N	Covered	\N	5	Consumable	VITROS 4600 - MAGNESIUM PACK SIZE 18	t	f	2026-06-03 12:31:55.855295	2026-06-03 12:31:55.855304	59	\N	LAB0161
1894	3	3	MAT-00966	VITROS 4600 - MAGNESIUM PACK SIZE 60	58	37	5	18	54	3815.96	\N	Covered	\N	5	Consumable	VITROS 4600 - MAGNESIUM PACK SIZE 60	t	f	2026-06-03 12:31:55.85748	2026-06-03 12:31:55.857489	59	\N	LAB0162
1895	3	3	MAT-00967	VITROS 4600 - MAS™ DIABETES CONTROL	58	37	5	48	168	3912.04	\N	Covered	\N	5	Consumable	VITROS 4600 - MAS™ DIABETES CONTROL	t	f	2026-06-03 12:31:55.859685	2026-06-03 12:31:55.859696	59	\N	LAB0163
1896	3	3	MAT-00968	VITROS 4600 - PHOSPHORUS PACK SIZE 18	58	37	5	40	92	1036.22	\N	Covered	\N	5	Consumable	VITROS 4600 - PHOSPHORUS PACK SIZE 18	t	f	2026-06-03 12:31:55.86226	2026-06-03 12:31:55.86227	59	\N	LAB0164
1897	3	3	MAT-00969	VITROS 4600 - PHOSPHORUS PACK SIZE 60	58	37	5	206	555	861.63	\N	Covered	\N	5	Consumable	VITROS 4600 - PHOSPHORUS PACK SIZE 60	t	f	2026-06-03 12:31:55.864361	2026-06-03 12:31:55.864369	59	\N	LAB0165
1898	3	3	MAT-00970	VITROS 4600 - POTASSIUM PACK SIZE 50	58	37	5	32	113	4385.43	\N	Covered	\N	5	Consumable	VITROS 4600 - POTASSIUM PACK SIZE 50	t	f	2026-06-03 12:31:55.866449	2026-06-03 12:31:55.866458	59	\N	LAB0166
1899	3	3	MAT-00971	VITROS 4600 - PROTEIN PV1	58	37	5	31	88	2966.19	\N	Covered	\N	5	Consumable	VITROS 4600 - PROTEIN PV1	t	f	2026-06-03 12:31:55.868448	2026-06-03 12:31:55.868456	59	\N	LAB0167
1900	3	3	MAT-00972	VITROS 4600 - PROTEIN PV2	58	37	5	15	57	4315.39	\N	Covered	\N	5	Consumable	VITROS 4600 - PROTEIN PV2	t	f	2026-06-03 12:31:55.870454	2026-06-03 12:31:55.870463	59	\N	LAB0168
1901	3	3	MAT-00973	VITROS 4600 - PROTEIN PV3	58	37	5	33	124	3656.96	\N	Covered	\N	5	Consumable	VITROS 4600 - PROTEIN PV3	t	f	2026-06-03 12:31:55.872518	2026-06-03 12:31:55.872529	59	\N	LAB0169
1902	3	3	MAT-00974	VITROS 4600 - SODIUM PACK SIZE 50	58	37	5	21	44	4025.19	\N	Covered	\N	5	Consumable	VITROS 4600 - SODIUM PACK SIZE 50	t	f	2026-06-03 12:31:55.874627	2026-06-03 12:31:55.874636	59	\N	LAB0170
1903	3	3	MAT-00975	VITROS 4600 - TGL PACK SIZE 60	58	37	5	13	47	1711.85	\N	Covered	\N	5	Consumable	VITROS 4600 - TGL PACK SIZE 60	t	f	2026-06-03 12:31:55.876933	2026-06-03 12:31:55.876945	59	\N	LAB0171
1904	3	3	MAT-00976	VITROS 4600 - TOTAL BILIRUBIN PACK SIZE 60	58	37	5	29	97	4970.52	\N	Covered	\N	5	Consumable	VITROS 4600 - TOTAL BILIRUBIN PACK SIZE 60	t	f	2026-06-03 12:31:55.879383	2026-06-03 12:31:55.879391	59	\N	LAB0172
1905	3	3	MAT-00977	VITROS 4600 - TOTAL PROTEIN PACK SIZE 50	58	37	5	22	74	2902.16	\N	Covered	\N	5	Consumable	VITROS 4600 - TOTAL PROTEIN PACK SIZE 50	t	f	2026-06-03 12:31:55.881489	2026-06-03 12:31:55.881497	59	\N	LAB0173
1906	3	3	MAT-00978	VITROS 4600 - TRANSFERRIN PACK SIZE 50	58	37	5	192	420	505.21	\N	Covered	\N	5	Consumable	VITROS 4600 - TRANSFERRIN PACK SIZE 50	t	f	2026-06-03 12:31:55.883495	2026-06-03 12:31:55.883504	59	\N	LAB0174
1907	3	3	MAT-00979	VITROS 4600 - UPRO PACK SIZE 18	58	37	5	24	91	4143.58	\N	Covered	\N	5	Consumable	VITROS 4600 - UPRO PACK SIZE 18	t	f	2026-06-03 12:31:55.885484	2026-06-03 12:31:55.885492	59	\N	LAB0175
1908	3	3	MAT-00980	VITROS 4600 - UPRO PACK SIZE 50	58	37	5	42	98	3044.13	\N	Covered	\N	5	Consumable	VITROS 4600 - UPRO PACK SIZE 50	t	f	2026-06-03 12:31:55.887467	2026-06-03 12:31:55.887476	59	\N	LAB0176
1909	3	3	MAT-00981	VITROS 4600 - UREA (BUN) PACK SIZE 60	58	37	5	50	103	2480.82	\N	Covered	\N	5	Consumable	VITROS 4600 - UREA (BUN) PACK SIZE 60	t	f	2026-06-03 12:31:55.889617	2026-06-03 12:31:55.889626	59	\N	LAB0177
1910	3	3	MAT-00982	VITROS 4600 - URIC ACID PACK SIZE 60	58	37	5	19	67	1480.99	\N	Covered	\N	5	Consumable	VITROS 4600 - URIC ACID PACK SIZE 60	t	f	2026-06-03 12:31:55.891738	2026-06-03 12:31:55.891746	59	\N	LAB0178
1911	3	3	MAT-00983	VITROS 4600 - URINE MICRO ALBUMIN PACK SIZE 50	58	37	5	40	113	1604.65	\N	Covered	\N	5	Consumable	VITROS 4600 - URINE MICRO ALBUMIN PACK SIZE 50	t	f	2026-06-03 12:31:55.894242	2026-06-03 12:31:55.894255	59	\N	LAB0179
1912	3	3	MAT-00984	VITROS 4600 - URINE PROTEIN PERFORMANCE VERIFIER 1	58	37	5	24	85	3826.58	\N	Covered	\N	5	Consumable	VITROS 4600 - URINE PROTEIN PERFORMANCE VERIFIER 1	t	f	2026-06-03 12:31:55.896744	2026-06-03 12:31:55.896752	59	\N	LAB0180
1913	3	3	MAT-00985	VITROS 4600 - URINE PROTEIN PERFORMANCE VERIFIER 2	58	37	5	17	42	3719.92	\N	Covered	\N	5	Consumable	VITROS 4600 - URINE PROTEIN PERFORMANCE VERIFIER 2	t	f	2026-06-03 12:31:55.898793	2026-06-03 12:31:55.898801	59	\N	LAB0181
1914	3	3	MAT-00986	VITROS 4600 - LDH PACK SIZE 50	58	37	5	30	68	2054.5	\N	Covered	\N	5	Consumable	VITROS 4600 - LDH PACK SIZE 50	t	f	2026-06-03 12:31:55.900779	2026-06-03 12:31:55.900788	59	\N	LAB0182
1915	3	3	MAT-00987	VITROS 4600 - CSF PROTEIN	58	37	5	12	42	3496.72	\N	Covered	\N	5	Consumable	VITROS 4600 - CSF PROTEIN	t	f	2026-06-03 12:31:55.902772	2026-06-03 12:31:55.90278	59	\N	LAB0183
1916	3	3	MAT-00988	VITROS MICRO SAMPLE CUPS	58	37	5	244	813	641.85	\N	Covered	\N	18	Consumable	VITROS MICRO SAMPLE CUPS	t	f	2026-06-03 12:31:55.904771	2026-06-03 12:31:55.90478	59	\N	LAB0184
1917	3	3	MAT-00989	VITROS® A1C SLIDES	58	37	5	43	131	4649.85	\N	Covered	\N	5	Consumable	VITROS® A1C SLIDES	t	f	2026-06-03 12:31:55.906939	2026-06-03 12:31:55.906948	59	\N	LAB0185
1918	3	3	MAT-00990	VITROS® CAL KIT 33	58	37	5	13	37	2201.01	\N	Covered	\N	5	Consumable	VITROS® CAL KIT 33	t	f	2026-06-03 12:31:55.909108	2026-06-03 12:31:55.909118	59	\N	LAB0186
1919	3	3	MAT-00991	BD - VAC SODIUM CITRATE 2.7ML	58	41	5	40	103	1490.69	\N	Covered	\N	5	Consumable	BD - VAC SODIUM CITRATE 2.7ML	t	f	2026-06-03 12:31:55.925054	2026-06-03 12:31:55.925068	59	\N	LAB0187
1920	3	3	MAT-00992	BLUE TIPS-(PACK)	58	39	5	50	163	4357.45	\N	Covered	\N	5	Consumable	BLUE TIPS-(PACK)	t	f	2026-06-03 12:31:55.928027	2026-06-03 12:31:55.928041	59	\N	LAB0188
1921	3	3	MAT-00993	FILTER PAPER SHEET-WHITE LONG	58	39	5	48	163	3459.76	\N	Covered	\N	5	Consumable	FILTER PAPER SHEET-WHITE LONG	t	f	2026-06-03 12:31:55.930886	2026-06-03 12:31:55.930897	59	\N	LAB0189
1922	3	3	MAT-00994	RED TUBE PLAIN-PAED1	58	41	5	43	103	3663.07	\N	Covered	\N	5	Consumable	RED TUBE PLAIN-PAED1	t	f	2026-06-03 12:31:55.933471	2026-06-03 12:31:55.933482	59	\N	LAB0190
1923	3	3	MAT-00995	URINE CONTAINER STERILE	58	41	5	38	132	3897.13	\N	Covered	\N	5	Consumable	URINE CONTAINER STERILE	t	f	2026-06-03 12:31:55.935993	2026-06-03 12:31:55.936004	59	\N	LAB0191
1924	3	3	MAT-00996	URINE CONTAINER UNSTERILE-LABLED	58	41	5	48	144	3428.59	\N	Covered	\N	5	Consumable	URINE CONTAINER UNSTERILE-LABLED	t	f	2026-06-03 12:31:55.938511	2026-06-03 12:31:55.938522	59	\N	LAB0192
1925	3	3	MAT-00997	URINE STRIP 10 PARAMETER-LONG EXPIRY	58	43	5	45	137	2885.05	\N	Covered	\N	5	Consumable	URINE STRIP 10 PARAMETER-LONG EXPIRY	t	f	2026-06-03 12:31:55.941263	2026-06-03 12:31:55.941275	59	\N	LAB0193
1926	3	3	MAT-00998	VDRL - ARKRAY	58	42	5	11	40	3092.49	\N	Covered	\N	5	Consumable	VDRL - ARKRAY	t	f	2026-06-03 12:31:55.944209	2026-06-03 12:31:55.944226	59	\N	LAB0194
1927	3	3	MAT-00999	YELLOW TIPS-PACK,	58	41	5	19	66	4428.85	\N	Covered	\N	5	Consumable	YELLOW TIPS-PACK,	t	f	2026-06-03 12:31:55.947197	2026-06-03 12:31:55.947208	59	\N	LAB0195
1928	3	3	MAT-01000	SLIDES (LABTEX)	58	41	5	42	89	1446.42	\N	Covered	\N	5	Consumable	SLIDES (LABTEX)	t	f	2026-06-03 12:31:55.949807	2026-06-03 12:31:55.949818	59	\N	LAB0196
1929	3	3	MAT-01001	ERBA H7100 LYSE1	58	40	5	429	1225	818.16	\N	Covered	\N	5	Consumable	ERBA H7100 LYSE1	t	f	2026-06-03 12:31:55.952405	2026-06-03 12:31:55.952416	59	\N	LAB0197
1930	3	3	MAT-01002	ERBA H7100 LYSE2 (1000ML)	58	40	5	28	80	1004.22	\N	Covered	\N	5	Consumable	ERBA H7100 LYSE2 (1000ML)	t	f	2026-06-03 12:31:55.954931	2026-06-03 12:31:55.954941	59	\N	LAB0198
1931	3	3	MAT-01003	ERBA H7100DIL RET (1000ML)	58	40	5	496	1927	814.6	\N	Covered	\N	5	Consumable	ERBA H7100DIL RET (1000ML)	t	f	2026-06-03 12:31:55.957636	2026-06-03 12:31:55.957647	59	\N	LAB0199
1932	3	3	MAT-01004	ERBA H7100 FLURO DIFF (42ML)	58	40	5	14	38	1323.79	\N	Covered	\N	5	Consumable	ERBA H7100 FLURO DIFF (42ML)	t	f	2026-06-03 12:31:55.960344	2026-06-03 12:31:55.960358	59	\N	LAB0200
1933	3	3	MAT-01005	ERBA H7100 CLEAN 10X4 ML	58	40	5	39	86	4172.58	\N	Covered	\N	5	Consumable	ERBA H7100 CLEAN 10X4 ML	t	f	2026-06-03 12:31:55.963433	2026-06-03 12:31:55.963445	59	\N	LAB0201
1934	3	3	MAT-01006	ERBA H7100 DIL 20Ltrs	58	40	5	19	58	4509.6	\N	Covered	\N	5	Consumable	ERBA H7100 DIL 20Ltrs	t	f	2026-06-03 12:31:55.966177	2026-06-03 12:31:55.966188	59	\N	LAB0202
1935	3	3	MAT-01007	ERBA H7100 DIL 20Ltrs	58	40	5	40	89	4089.52	\N	Covered	\N	5	Consumable	ERBA H7100 DIL 20Ltrs	t	f	2026-06-03 12:31:55.96873	2026-06-03 12:31:55.968741	59	\N	LAB0203
1936	3	3	MAT-01008	ERBA 360 CLEAN	58	40	5	24	95	1640.44	\N	Covered	\N	5	Consumable	ERBA 360 CLEAN	t	f	2026-06-03 12:31:55.97141	2026-06-03 12:31:55.971421	59	\N	LAB0204
1937	3	3	MAT-01009	ACTIN (APTT)	58	40	5	50	116	1018.55	\N	Covered	\N	5	Consumable	ACTIN (APTT)	t	f	2026-06-03 12:31:55.974165	2026-06-03 12:31:55.974176	59	\N	LAB0205
1938	3	3	MAT-01010	THROMBOREL-S	58	40	5	22	86	4307.63	\N	Covered	\N	5	Consumable	THROMBOREL-S	t	f	2026-06-03 12:31:55.976945	2026-06-03 12:31:55.976959	59	\N	LAB0206
1939	3	3	MAT-01011	CITROL 1E	58	40	5	40	153	3330.35	\N	Covered	\N	5	Consumable	CITROL 1E	t	f	2026-06-03 12:31:55.980052	2026-06-03 12:31:55.980063	59	\N	LAB0207
1940	3	3	MAT-01012	CITROL 2E	58	40	5	39	85	3199.57	\N	Covered	\N	5	Consumable	CITROL 2E	t	f	2026-06-03 12:31:55.982631	2026-06-03 12:31:55.982643	59	\N	LAB0208
1941	3	3	MAT-01013	PEDAL DUSTBIN 12LTRS	58	39	5	13	34	2785.39	\N	Covered	\N	18	Consumable	PEDAL DUSTBIN 12LTRS	t	f	2026-06-03 12:31:55.985206	2026-06-03 12:31:55.985217	59	\N	LAB0209
1942	3	3	MAT-01014	ABSOLUTE ALCOHOL 100%	58	42	5	43	98	4776.94	\N	Covered	\N	18	Consumable	ABSOLUTE ALCOHOL 100%	t	f	2026-06-03 12:31:55.987742	2026-06-03 12:31:55.987753	59	\N	LAB0210
1943	3	3	MAT-01015	ALBERT STAIN A	58	42	5	30	103	2516.68	\N	Covered	\N	5	Consumable	ALBERT STAIN A	t	f	2026-06-03 12:31:55.990379	2026-06-03 12:31:55.990391	59	\N	LAB0211
1944	3	3	MAT-01016	ALBERT STAIN B	58	42	5	38	77	3073.02	\N	Covered	\N	5	Consumable	ALBERT STAIN B	t	f	2026-06-03 12:31:55.993094	2026-06-03 12:31:55.993108	59	\N	LAB0212
1945	3	3	MAT-01017	ANAEROBIC GAS PACK	58	42	5	28	63	3227.62	\N	Covered	\N	5	Consumable	ANAEROBIC GAS PACK	t	f	2026-06-03 12:31:55.996309	2026-06-03 12:31:55.996321	59	\N	LAB0213
1946	3	3	MAT-01018	ASO 35T TULIP	58	42	5	43	101	4857.13	\N	Covered	\N	5	Consumable	ASO 35T TULIP	t	f	2026-06-03 12:31:55.99895	2026-06-03 12:31:55.998961	59	\N	LAB0214
1947	3	3	MAT-01019	BACTERIOLOGY REGISTER	58	44	5	39	92	4618.21	\N	Covered	\N	5	Consumable	BACTERIOLOGY REGISTER	t	f	2026-06-03 12:31:56.001541	2026-06-03 12:31:56.001553	59	\N	LAB0215
1948	3	3	MAT-01020	CALCIUM HYDROXIDE POWDER - 500GMS	58	42	5	49	130	4129.59	\N	Covered	\N	5	Consumable	CALCIUM HYDROXIDE POWDER - 500GMS	t	f	2026-06-03 12:31:56.004089	2026-06-03 12:31:56.004101	59	\N	LAB0216
1949	3	3	MAT-01021	CENTRIFUGE TUBE STAND	58	42	5	50	144	3689.69	\N	Covered	\N	18	Consumable	CENTRIFUGE TUBE STAND	t	f	2026-06-03 12:31:56.006697	2026-06-03 12:31:56.00671	59	\N	LAB0217
1950	3	3	MAT-01022	CENTRIFUGE TUBES 50ML STERILE TARSONS  - 500NOS	58	42	5	34	87	4736.56	\N	Covered	\N	5	Consumable	CENTRIFUGE TUBES 50ML STERILE TARSONS  - 500NOS	t	f	2026-06-03 12:31:56.009437	2026-06-03 12:31:56.009449	59	\N	LAB0218
1951	3	3	MAT-01023	COTTON WICK	58	42	5	27	75	2255.87	\N	Covered	\N	5	Consumable	COTTON WICK	t	f	2026-06-03 12:31:56.012709	2026-06-03 12:31:56.012723	59	\N	LAB0219
1952	3	3	MAT-01024	CRYOBOX - 1.5-2ML, 9X9 ARRAY	58	42	5	45	144	4668.99	\N	Covered	\N	5	Consumable	CRYOBOX - 1.5-2ML, 9X9 ARRAY	t	f	2026-06-03 12:31:56.01547	2026-06-03 12:31:56.015481	59	\N	LAB0220
1953	3	3	MAT-01025	CRYOVIALS -2ML	58	42	5	42	158	3649.81	\N	Covered	\N	5	Consumable	CRYOVIALS -2ML	t	f	2026-06-03 12:31:56.018024	2026-06-03 12:31:56.018035	59	\N	LAB0221
1954	3	3	MAT-01026	DENGUE ELISA KIT (J.MITRA) IGG	58	42	5	40	143	3479.33	\N	Covered	\N	5	Consumable	DENGUE ELISA KIT (J.MITRA) IGG	t	f	2026-06-03 12:31:56.020612	2026-06-03 12:31:56.020623	59	\N	LAB0222
1955	3	3	MAT-01027	DENGUE ELISA KIT (J.MITRA) IGM	58	42	5	60	231	644.54	\N	Covered	\N	5	Consumable	DENGUE ELISA KIT (J.MITRA) IGM	t	f	2026-06-03 12:31:56.02337	2026-06-03 12:31:56.023382	59	\N	LAB0223
1956	3	3	MAT-01028	DENGUE ELISA KIT (J.MITRA) NS1	58	42	5	40	108	2084.88	\N	Covered	\N	5	Consumable	DENGUE ELISA KIT (J.MITRA) NS1	t	f	2026-06-03 12:31:56.02615	2026-06-03 12:31:56.026163	59	\N	LAB0224
1957	3	3	MAT-01029	DILUENT FOR DNA EXTRACTION MB228-500ML @HIMEDIA	58	42	5	12	29	2859.56	\N	Covered	\N	5	Consumable	DILUENT FOR DNA EXTRACTION MB228-500ML @HIMEDIA	t	f	2026-06-03 12:31:56.029318	2026-06-03 12:31:56.029331	59	\N	LAB0225
1958	3	3	MAT-01030	EM020 - COLISTIN - 10ST	58	42	5	35	87	1979.47	\N	Covered	\N	5	Consumable	EM020 - COLISTIN - 10ST	t	f	2026-06-03 12:31:56.032058	2026-06-03 12:31:56.032069	59	\N	LAB0226
1959	3	3	MAT-01031	EM089 TEGICYCLIN HIMEDIA	58	42	5	34	118	3180.99	\N	Covered	\N	5	Consumable	EM089 TEGICYCLIN HIMEDIA	t	f	2026-06-03 12:31:56.034616	2026-06-03 12:31:56.034627	59	\N	LAB0227
1960	3	3	MAT-01032	FACE SHEILD	58	42	5	29	114	4221.71	\N	Covered	\N	5	Consumable	FACE SHEILD	t	f	2026-06-03 12:31:56.037271	2026-06-03 12:31:56.037283	59	\N	LAB0228
1961	3	3	MAT-01033	FD003 POLYMIXIN B HIMEDIA	58	42	5	44	140	4326.66	\N	Covered	\N	5	Consumable	FD003 POLYMIXIN B HIMEDIA	t	f	2026-06-03 12:31:56.039956	2026-06-03 12:31:56.039969	59	\N	LAB0229
1962	3	3	MAT-01034	GW089-CONCAVITY SLIDE	58	42	5	27	58	2639.69	\N	Covered	\N	5	Consumable	GW089-CONCAVITY SLIDE	t	f	2026-06-03 12:31:56.042753	2026-06-03 12:31:56.042765	59	\N	LAB0230
1963	3	3	MAT-01035	H1N1 RTPCR KIT - HELINI - 25 TESTS	58	42	5	36	139	3088.53	\N	Covered	\N	5	Consumable	H1N1 RTPCR KIT - HELINI - 25 TESTS	t	f	2026-06-03 12:31:56.045944	2026-06-03 12:31:56.045958	59	\N	LAB0231
1964	3	3	MAT-01036	HCV SDBIOLINE 25 TEST	58	42	5	24	81	2655.58	\N	Covered	\N	5	Consumable	HCV SDBIOLINE 25 TEST	t	f	2026-06-03 12:31:56.048791	2026-06-03 12:31:56.048802	59	\N	LAB0232
1965	3	3	MAT-01037	L J MEDIA SLANT	58	42	5	163	515	688.41	\N	Covered	\N	5	Consumable	L J MEDIA SLANT	t	f	2026-06-03 12:31:56.051418	2026-06-03 12:31:56.051429	59	\N	LAB0233
1966	3	3	MAT-01038	LAB SAFETY GOGGLES -BIG SIZE- FULLY COVERED WIDE VISION AREA	58	42	5	47	155	1821.86	\N	Covered	\N	18	Consumable	LAB SAFETY GOGGLES -BIG SIZE- FULLY COVERED WIDE VISION AREA	t	f	2026-06-03 12:31:56.053987	2026-06-03 12:31:56.053998	59	\N	LAB0234
1967	3	3	MAT-01039	LUGOL IODINE SOLUTION	58	42	5	39	80	1865.21	\N	Covered	\N	5	Consumable	LUGOL IODINE SOLUTION	t	f	2026-06-03 12:31:56.056574	2026-06-03 12:31:56.056586	59	\N	LAB0235
1968	3	3	MAT-01040	M025S - SELENITE F BROTH - 100GMS	58	42	5	41	163	3702.44	\N	Covered	\N	5	Consumable	M025S - SELENITE F BROTH - 100GMS	t	f	2026-06-03 12:31:56.059281	2026-06-03 12:31:56.059293	59	\N	LAB0236
1969	3	3	MAT-01041	MARKER PENS	58	44	5	23	76	1475.78	\N	Covered	\N	18	Consumable	MARKER PENS	t	f	2026-06-03 12:31:56.062567	2026-06-03 12:31:56.062581	59	\N	LAB0237
1970	3	3	MAT-01042	MICROAMP 96-WELL RXN PLATE -, EA NO BARCODE UNIT SIZE: 10 PLATES	58	42	5	40	135	3248.64	\N	Covered	\N	5	Consumable	MICROAMP 96-WELL RXN PLATE -, EA NO BARCODE UNIT SIZE: 10 PLATES	t	f	2026-06-03 12:31:56.065347	2026-06-03 12:31:56.065359	59	\N	LAB0238
1971	3	3	MAT-01043	MICROBIOLOGY REQUEST FORM	58	44	5	49	145	1899.99	\N	Covered	\N	5	Consumable	MICROBIOLOGY REQUEST FORM	t	f	2026-06-03 12:31:56.067968	2026-06-03 12:31:56.067979	59	\N	LAB0239
1972	3	3	MAT-01044	MICROCENTRIFUGE TUBE 0.5ML (1X500NO)	58	42	5	12	32	4264.37	\N	Covered	\N	5	Consumable	MICROCENTRIFUGE TUBE 0.5ML (1X500NO)	t	f	2026-06-03 12:31:56.070586	2026-06-03 12:31:56.070597	59	\N	LAB0240
1973	3	3	MAT-01045	MS2760H-50NO HIVIRALTM TRANSPORT KIT WITH 3ML VTM IN ROUND BOTTOM TUBE, TWO STERILE FLOCKED SWAB W/BREAKPOINT	58	42	5	306	1086	926.6	\N	Covered	\N	5	Consumable	MS2760H-50NO HIVIRALTM TRANSPORT KIT WITH 3ML VTM IN ROUND BOTTOM TUBE, TWO STERILE FLOCKED SWAB W/BREAKPOINT	t	f	2026-06-03 12:31:56.073192	2026-06-03 12:31:56.073203	59	\N	LAB0241
1974	3	3	MAT-01046	MV001-500G - NUTRIENT AGAR -HIMEDIA	58	42	5	31	69	4734.36	\N	Covered	\N	5	Consumable	MV001-500G - NUTRIENT AGAR -HIMEDIA	t	f	2026-06-03 12:31:56.075969	2026-06-03 12:31:56.075981	59	\N	LAB0242
1975	3	3	MAT-01047	MV189 TCBS POWDER MEDIA-100G	58	42	5	46	178	1505.55	\N	Covered	\N	5	Consumable	MV189 TCBS POWDER MEDIA-100G	t	f	2026-06-03 12:31:56.079196	2026-06-03 12:31:56.07921	59	\N	LAB0243
1976	3	3	MAT-01048	NON-ABSORBANT COTTON	58	42	5	13	47	1269.54	\N	Covered	\N	5	Consumable	NON-ABSORBANT COTTON	t	f	2026-06-03 12:31:56.08205	2026-06-03 12:31:56.082062	59	\N	LAB0244
1977	3	3	MAT-01049	PETRIDISH 90X14 TRIPLE VENT (PKT OF 500NO)	58	42	5	459	1158	750.54	\N	Covered	\N	5	Consumable	PETRIDISH 90X14 TRIPLE VENT (PKT OF 500NO)	t	f	2026-06-03 12:31:56.084654	2026-06-03 12:31:56.084666	59	\N	LAB0245
1978	3	3	MAT-01050	POTASSIUM HYDROXIDE 40% - NICE - 500ML	58	42	5	318	1003	775.39	\N	Covered	\N	5	Consumable	POTASSIUM HYDROXIDE 40% - NICE - 500ML	t	f	2026-06-03 12:31:56.087345	2026-06-03 12:31:56.087357	59	\N	LAB0246
1979	3	3	MAT-01051	POVIDINE IODINE SOLUTION 500ML	58	42	5	40	146	3251.76	\N	Covered	\N	5	Consumable	POVIDINE IODINE SOLUTION 500ML	t	f	2026-06-03 12:31:56.090085	2026-06-03 12:31:56.090098	59	\N	LAB0247
1980	3	3	MAT-01052	PW146-1X500NO MICROCENTRIFUGE TUBE 1.5ML	58	42	5	466	1662	584.5	\N	Covered	\N	5	Consumable	PW146-1X500NO MICROCENTRIFUGE TUBE 1.5ML	t	f	2026-06-03 12:31:56.092857	2026-06-03 12:31:56.092869	59	\N	LAB0248
1981	3	3	MAT-01053	PW147-1X500NO MICROCENTRIFUGE TUBE @HIMEDIA	58	42	5	308	632	703.81	\N	Covered	\N	5	Consumable	PW147-1X500NO MICROCENTRIFUGE TUBE @HIMEDIA	t	f	2026-06-03 12:31:56.095995	2026-06-03 12:31:56.096009	59	\N	LAB0249
1982	3	3	MAT-01054	RCM ANAEROBIC MEDIA BOTTLE	58	42	5	39	156	1924.28	\N	Covered	\N	5	Consumable	RCM ANAEROBIC MEDIA BOTTLE	t	f	2026-06-03 12:31:56.098858	2026-06-03 12:31:56.098869	59	\N	LAB0250
1983	3	3	MAT-01055	S013 GRAMS IODINE	58	42	5	30	111	4447.65	\N	Covered	\N	5	Consumable	S013 GRAMS IODINE	t	f	2026-06-03 12:31:56.101492	2026-06-03 12:31:56.101503	59	\N	LAB0251
1984	3	3	MAT-01056	SEEGENERALE KIT	58	42	5	41	131	1383.41	\N	Covered	\N	5	Consumable	SEEGENERALE KIT	t	f	2026-06-03 12:31:56.104089	2026-06-03 12:31:56.1041	59	\N	LAB0252
1985	3	3	MAT-01057	SEMI SKIRTED PLATE 96X0.2ML - MEDOX  (PACK SIZE:25NOS)	58	42	5	272	785	743.95	\N	Covered	\N	5	Consumable	SEMI SKIRTED PLATE 96X0.2ML - MEDOX  (PACK SIZE:25NOS)	t	f	2026-06-03 12:31:56.106814	2026-06-03 12:31:56.106826	59	\N	LAB0253
1986	3	3	MAT-01058	SEROLOGY REGISTER	58	44	5	99	256	561.1	\N	Covered	\N	5	Consumable	SEROLOGY REGISTER	t	f	2026-06-03 12:31:56.109581	2026-06-03 12:31:56.109593	59	\N	LAB0254
1987	3	3	MAT-01059	SIMON CITRATE AGAR-500GMS	58	42	5	20	45	2264.03	\N	Covered	\N	5	Consumable	SIMON CITRATE AGAR-500GMS	t	f	2026-06-03 12:31:56.112753	2026-06-03 12:31:56.112767	59	\N	LAB0255
1988	3	3	MAT-01060	SLIDE TRAY	58	42	5	14	46	1907.68	\N	Covered	\N	18	Consumable	SLIDE TRAY	t	f	2026-06-03 12:31:56.115582	2026-06-03 12:31:56.115593	59	\N	LAB0256
1989	3	3	MAT-01061	SODIUM HYPOCHLORITE SOLUTION 5L QUALIGENERALS	58	42	5	36	118	3873.11	\N	Covered	\N	18	Consumable	SODIUM HYPOCHLORITE SOLUTION 5L QUALIGENERALS	t	f	2026-06-03 12:31:56.118188	2026-06-03 12:31:56.118199	59	\N	LAB0257
1990	3	3	MAT-01062	SPATULLA	58	42	5	45	177	3271	\N	Covered	\N	18	Consumable	SPATULLA	t	f	2026-06-03 12:31:56.120777	2026-06-03 12:31:56.120789	59	\N	LAB0258
1991	3	3	MAT-01063	SPIRIT LAMP METAL	58	42	5	28	90	4982.48	\N	Covered	\N	18	Consumable	SPIRIT LAMP METAL	t	f	2026-06-03 12:31:56.123516	2026-06-03 12:31:56.123529	59	\N	LAB0259
1992	3	3	MAT-01064	SSR RELAY (INCUBATOR)	58	42	5	36	109	4250.21	\N	Covered	\N	18	Consumable	SSR RELAY (INCUBATOR)	t	f	2026-06-03 12:31:56.126287	2026-06-03 12:31:56.126299	59	\N	LAB0260
1993	3	3	MAT-01065	SWABS FOR CULTURE WITH TUBE (STERILE)	58	39	5	14	54	1826.63	\N	Covered	\N	5	Consumable	SWABS FOR CULTURE WITH TUBE (STERILE)	t	f	2026-06-03 12:31:56.129587	2026-06-03 12:31:56.129601	59	\N	LAB0261
1994	3	3	MAT-01066	THIOGLYCOLLATE MEDIUM BOTTLE	58	42	5	33	127	3793.84	\N	Covered	\N	5	Consumable	THIOGLYCOLLATE MEDIUM BOTTLE	t	f	2026-06-03 12:31:56.132372	2026-06-03 12:31:56.132384	59	\N	LAB0262
1995	3	3	MAT-01067	TUBE RACK (15ML TUBES - CAPACITY-24)	58	42	5	32	72	2071.37	\N	Covered	\N	18	Consumable	TUBE RACK (15ML TUBES - CAPACITY-24)	t	f	2026-06-03 12:31:56.134957	2026-06-03 12:31:56.134968	59	\N	LAB0263
1996	3	3	MAT-01068	VENUS N95 MASK	58	42	5	21	44	1363.46	\N	Covered	\N	5	Consumable	VENUS N95 MASK	t	f	2026-06-03 12:31:56.13752	2026-06-03 12:31:56.137531	59	\N	LAB0264
1997	3	3	MAT-01069	VIROLOGY REGISTER	58	44	5	11	44	2315.18	\N	Covered	\N	5	Consumable	VIROLOGY REGISTER	t	f	2026-06-03 12:31:56.140106	2026-06-03 12:31:56.140128	59	\N	LAB0265
1998	3	3	MAT-01070	VLTM - TULIP	58	42	5	36	112	1835.83	\N	Covered	\N	5	Consumable	VLTM - TULIP	t	f	2026-06-03 12:31:56.142855	2026-06-03 12:31:56.142866	59	\N	LAB0266
1999	3	3	MAT-01071	ZIPLOCK COVERS SIZE 6X8	58	42	5	14	49	1339.35	\N	Covered	\N	18	Consumable	ZIPLOCK COVERS SIZE 6X8	t	f	2026-06-03 12:31:56.145946	2026-06-03 12:31:56.14596	59	\N	LAB0267
2000	3	3	MAT-01072	BROWN COLOUR COAT	59	45	5	277	865	332	\N	Covered	\N	5	Non-Consumable	BROWN COLOUR COAT	t	f	2026-06-03 12:31:56.148901	2026-06-03 12:31:56.148913	53	\N	LIN0001
2001	3	3	MAT-01073	GREY COLOUR COAT	59	45	5	428	1593	540	\N	Covered	\N	5	Non-Consumable	GREY COLOUR COAT	t	f	2026-06-03 12:31:56.151706	2026-06-03 12:31:56.151718	53	\N	LIN0002
2002	3	3	MAT-01074	BATH TOWEL - 400GMS WHITE DELUXE 27X54	59	45	5	34	77	1432.44	\N	Covered	\N	5	Non-Consumable	BATH TOWEL - 400GMS WHITE DELUXE 27X54	t	f	2026-06-03 12:31:56.154624	2026-06-03 12:31:56.154635	53	\N	LIN0003
2003	3	3	MAT-01075	BEDSHEET+ PILLOW COVER- PLANE WHITE SET 200 TC 40SX40S COUNT PREMIUM - SIZE: 60X90/18X28	59	45	5	20	60	1407.33	\N	Covered	\N	5	Non-Consumable	BEDSHEET+ PILLOW COVER- PLANE WHITE SET 200 TC 40SX40S COUNT PREMIUM - SIZE: 60X90/18X28	t	f	2026-06-03 12:31:56.157874	2026-06-03 12:31:56.157888	53	\N	LIN0004
2004	3	3	MAT-01076	BLUE STRIPS PATIENT GOWN	59	45	5	139	541	223.51	\N	Covered	\N	5	Non-Consumable	BLUE STRIPS PATIENT GOWN	t	f	2026-06-03 12:31:56.161181	2026-06-03 12:31:56.161196	53	\N	LIN0005
2005	3	3	MAT-01077	CH TOWEL 36*36	59	45	5	218	592	221.44	\N	Covered	\N	5	Non-Consumable	CH TOWEL 36*36	t	f	2026-06-03 12:31:56.164408	2026-06-03 12:31:56.16442	53	\N	LIN0006
2006	3	3	MAT-01078	DARK CHECKS PATIENT GOWN	59	45	5	33	117	1105.15	\N	Covered	\N	5	Non-Consumable	DARK CHECKS PATIENT GOWN	t	f	2026-06-03 12:31:56.16707	2026-06-03 12:31:56.167089	53	\N	LIN0007
2007	3	3	MAT-01079	DUCK CLOTH FOR CSSD - DARK GREEN	59	45	5	419	1599	768.62	\N	Covered	\N	5	Non-Consumable	DUCK CLOTH FOR CSSD - DARK GREEN	t	f	2026-06-03 12:31:56.169636	2026-06-03 12:31:56.169647	53	\N	LIN0008
2008	3	3	MAT-01080	FABRIC/ADMIRE/VAT DYED/114TC/60"WIDTH 16'SX16'S YARN COUNT --57 REED X 57 PICK  H-BLUE IN MTRS	59	45	5	380	835	656.17	\N	Covered	\N	5	Non-Consumable	FABRIC/ADMIRE/VAT DYED/114TC/60"WIDTH 16'SX16'S YARN COUNT --57 REED X 57 PICK  H-BLUE IN MTRS	t	f	2026-06-03 12:31:56.172146	2026-06-03 12:31:56.172158	53	\N	LIN0009
2009	3	3	MAT-01081	FABRIC/ADMIRE/VAT DYED/116TC/58"WIDTH  H-BLUE IN MTRS	59	45	5	361	813	675.24	\N	Covered	\N	5	Non-Consumable	FABRIC/ADMIRE/VAT DYED/116TC/58"WIDTH  H-BLUE IN MTRS	t	f	2026-06-03 12:31:56.174996	2026-06-03 12:31:56.175008	53	\N	LIN0010
2010	3	3	MAT-01082	FABRIC/BEAUTY/VAT DYED/120TC/60"WIDTH  H-BLUE IN MTRS	59	45	5	444	1719	340.58	\N	Covered	\N	5	Non-Consumable	FABRIC/BEAUTY/VAT DYED/120TC/60"WIDTH  H-BLUE IN MTRS	t	f	2026-06-03 12:31:56.177847	2026-06-03 12:31:56.177862	53	\N	LIN0011
2011	3	3	MAT-01083	FABRIC/CHARM/VAT DYED/144TC/58"WIDTH  B-GREEN IN MTRS	59	45	5	13	32	1707.21	\N	Covered	\N	5	Non-Consumable	FABRIC/CHARM/VAT DYED/144TC/58"WIDTH  B-GREEN IN MTRS	t	f	2026-06-03 12:31:56.181026	2026-06-03 12:31:56.181038	53	\N	LIN0012
2012	3	3	MAT-01084	FABRIC/DELIGHT 200 - SPRING-GREEN -60X90 IN MTRS	59	45	5	23	83	1930.18	\N	Covered	\N	5	Non-Consumable	FABRIC/DELIGHT 200 - SPRING-GREEN -60X90 IN MTRS	t	f	2026-06-03 12:31:56.183672	2026-06-03 12:31:56.183683	53	\N	LIN0013
2013	3	3	MAT-01085	FABRIC/DELIGHT/VAT DYED/210TC/58"WIDTH  B-GREEN IN MTRS	59	45	5	27	88	1754.5	\N	Covered	\N	5	Non-Consumable	FABRIC/DELIGHT/VAT DYED/210TC/58"WIDTH  B-GREEN IN MTRS	t	f	2026-06-03 12:31:56.186259	2026-06-03 12:31:56.18627	53	\N	LIN0014
2014	3	3	MAT-01086	FABRIC/DELIGHT/VAT DYED/210TC/58"WIDTH  H-BLUE IN MTRS	59	45	5	19	55	1797.23	\N	Covered	\N	5	Non-Consumable	FABRIC/DELIGHT/VAT DYED/210TC/58"WIDTH  H-BLUE IN MTRS	t	f	2026-06-03 12:31:56.18878	2026-06-03 12:31:56.188792	53	\N	LIN0015
2015	3	3	MAT-01087	FABRIC/DELIGHT/VAT DYED/210TC/58"WIDTH  TEAL IN MTRS	59	45	5	407	1178	510.26	\N	Covered	\N	5	Non-Consumable	FABRIC/DELIGHT/VAT DYED/210TC/58"WIDTH  TEAL IN MTRS	t	f	2026-06-03 12:31:56.191665	2026-06-03 12:31:56.191676	53	\N	LIN0016
2016	3	3	MAT-01088	GREEN COLOR SCRUB SUITS	59	45	5	49	185	1338.01	\N	Covered	\N	5	Non-Consumable	GREEN COLOR SCRUB SUITS	t	f	2026-06-03 12:31:56.194592	2026-06-03 12:31:56.194606	53	\N	LIN0017
2017	3	3	MAT-01089	GREEN STRIPS PATIENT GOWN	59	45	5	417	1338	920	\N	Covered	\N	5	Non-Consumable	GREEN STRIPS PATIENT GOWN	t	f	2026-06-03 12:31:56.197718	2026-06-03 12:31:56.19773	53	\N	LIN0018
2018	3	3	MAT-01090	GREEN SURGICAL GOWN	59	45	5	27	59	1435.22	\N	Covered	\N	5	Non-Consumable	GREEN SURGICAL GOWN	t	f	2026-06-03 12:31:56.200287	2026-06-03 12:31:56.200299	53	\N	LIN0019
2019	3	3	MAT-01091	LIGHT BLUE SCRUB SUITS	59	45	5	329	849	555.5	\N	Covered	\N	5	Non-Consumable	LIGHT BLUE SCRUB SUITS	t	f	2026-06-03 12:31:56.202902	2026-06-03 12:31:56.202912	53	\N	LIN0020
2020	3	3	MAT-01092	MEDIUM TOWEL 42*59	59	45	5	90	296	940.28	\N	Covered	\N	5	Non-Consumable	MEDIUM TOWEL 42*59	t	f	2026-06-03 12:31:56.205589	2026-06-03 12:31:56.2056	53	\N	LIN0021
2021	3	3	MAT-01093	NURSES UNIFORM (STAFF BOYS) PANT	59	45	5	33	120	1147.14	\N	Covered	\N	5	Non-Consumable	NURSES UNIFORM (STAFF BOYS) PANT	t	f	2026-06-03 12:31:56.20836	2026-06-03 12:31:56.208372	53	\N	LIN0022
2022	3	3	MAT-01094	NURSES UNIFORM (STAFF BOYS) SHIRT	59	45	5	40	112	1666.89	\N	Covered	\N	5	Non-Consumable	NURSES UNIFORM (STAFF BOYS) SHIRT	t	f	2026-06-03 12:31:56.21128	2026-06-03 12:31:56.211294	53	\N	LIN0023
2023	3	3	MAT-01095	NURSES UNIFORM (STAFF GIRLS) PANT	59	45	5	16	47	1486.97	\N	Covered	\N	5	Non-Consumable	NURSES UNIFORM (STAFF GIRLS) PANT	t	f	2026-06-03 12:31:56.214386	2026-06-03 12:31:56.214397	53	\N	LIN0024
2024	3	3	MAT-01096	NURSES UNIFORM (STAFF GIRLS) SHIRT	59	45	5	208	601	761.89	\N	Covered	\N	5	Non-Consumable	NURSES UNIFORM (STAFF GIRLS) SHIRT	t	f	2026-06-03 12:31:56.217025	2026-06-03 12:31:56.217037	53	\N	LIN0025
2025	3	3	MAT-01097	NURSES UNIFORMS (SUPERVISORS) FULL SET	59	45	5	37	126	1345.82	\N	Covered	\N	5	Non-Consumable	NURSES UNIFORMS (SUPERVISORS) FULL SET	t	f	2026-06-03 12:31:56.219643	2026-06-03 12:31:56.219654	53	\N	LIN0026
2026	3	3	MAT-01098	PACKING CLOTH SPINAL - 36*36	59	45	5	62	154	577.32	\N	Covered	\N	5	Consumable	PACKING CLOTH SPINAL - 36*36	t	f	2026-06-03 12:31:56.222213	2026-06-03 12:31:56.222224	53	\N	LIN0027
2027	3	3	MAT-01099	PATIENT GOWN BLUE SMALL STRIPS 36INCH WIDTH	59	45	5	28	59	1611.68	\N	Covered	\N	5	Consumable	PATIENT GOWN BLUE SMALL STRIPS 36INCH WIDTH	t	f	2026-06-03 12:31:56.225269	2026-06-03 12:31:56.225284	53	\N	LIN0028
2028	3	3	MAT-01100	PATIENT GOWN PINK SMALL STRIPS 36INCH WIDTH	59	45	5	36	130	1077.77	\N	Covered	\N	5	Consumable	PATIENT GOWN PINK SMALL STRIPS 36INCH WIDTH	t	f	2026-06-03 12:31:56.228544	2026-06-03 12:31:56.22856	53	\N	LIN0029
2029	3	3	MAT-01101	PLAIN SHEET 70*73	59	45	5	377	1487	952.03	\N	Covered	\N	5	Consumable	PLAIN SHEET 70*73	t	f	2026-06-03 12:31:56.23196	2026-06-03 12:31:56.231975	53	\N	LIN0030
2030	3	3	MAT-01102	PLAIN SHEET 80*87	59	45	5	38	152	1814.48	\N	Covered	\N	5	Consumable	PLAIN SHEET 80*87	t	f	2026-06-03 12:31:56.234956	2026-06-03 12:31:56.234968	53	\N	LIN0031
2031	3	3	MAT-01103	SKIN TOWEL 17*17	59	45	5	229	743	554.59	\N	Covered	\N	5	Consumable	SKIN TOWEL 17*17	t	f	2026-06-03 12:31:56.237738	2026-06-03 12:31:56.23775	53	\N	LIN0032
2032	3	3	MAT-01104	TEEL (NEW GREEN) BED SHEET	59	45	5	119	448	818.22	\N	Covered	\N	5	Non-Consumable	TEEL (NEW GREEN) BED SHEET	t	f	2026-06-03 12:31:56.240656	2026-06-03 12:31:56.24067	53	\N	LIN0033
2033	3	3	MAT-01105	TEEL (NEW GREEN) PILLOW COVER	59	45	5	350	844	258.33	\N	Covered	\N	5	Non-Consumable	TEEL (NEW GREEN) PILLOW COVER	t	f	2026-06-03 12:31:56.243781	2026-06-03 12:31:56.243793	53	\N	LIN0034
2034	3	3	MAT-01106	TOWEL EDGE HOLE 80*87	59	45	5	33	76	1742.33	\N	Covered	\N	5	Non-Consumable	TOWEL EDGE HOLE 80*87	t	f	2026-06-03 12:31:56.247009	2026-06-03 12:31:56.247025	53	\N	LIN0035
2035	3	3	MAT-01107	APRON	59	45	5	284	702	978.04	\N	Covered	\N	5	Non-Consumable	APRON	t	f	2026-06-03 12:31:56.249967	2026-06-03 12:31:56.249977	53	\N	LIN0036
2036	3	3	MAT-01108	20mm 45° Bend CPVC	60	46	5	21	55	3586.21	\N	Covered	\N	18	Consumable	20mm 45° Bend CPVC	t	f	2026-06-03 12:31:56.252386	2026-06-03 12:31:56.252396	59	\N	PLB0001
2037	3	3	MAT-01109	20mm Coupler CPVC	60	46	5	47	101	1286.38	\N	Covered	\N	18	Consumable	20mm Coupler CPVC	t	f	2026-06-03 12:31:56.254717	2026-06-03 12:31:56.254727	59	\N	PLB0002
2038	3	3	MAT-01110	20mm Elbow CPVC	60	46	5	91	235	67.78	\N	Covered	\N	18	Consumable	20mm Elbow CPVC	t	f	2026-06-03 12:31:56.2572	2026-06-03 12:31:56.257213	59	\N	PLB0003
2039	3	3	MAT-01111	20mm End Cap CPVC	60	46	5	30	75	3985.75	\N	Covered	\N	18	Consumable	20mm End Cap CPVC	t	f	2026-06-03 12:31:56.25967	2026-06-03 12:31:56.259681	59	\N	PLB0004
2040	3	3	MAT-01112	20mm 45° Bend CPVC	60	46	5	19	52	2947.6	\N	Covered	\N	18	Consumable	20mm 45° Bend CPVC	t	f	2026-06-03 12:31:56.262564	2026-06-03 12:31:56.262577	59	\N	PLB0005
2041	3	3	MAT-01113	20mm MTA CPVC	60	46	5	432	1160	949.14	\N	Covered	\N	18	Consumable	20mm MTA CPVC	t	f	2026-06-03 12:31:56.265182	2026-06-03 12:31:56.265192	59	\N	PLB0006
2042	3	3	MAT-01114	20mm Ball Volve CPVC	60	46	5	15	51	3949.56	\N	Covered	\N	18	Consumable	20mm Ball Volve CPVC	t	f	2026-06-03 12:31:56.267647	2026-06-03 12:31:56.267659	59	\N	PLB0007
2043	3	3	MAT-01115	20mm Clamp	60	46	5	14	48	3060.85	\N	Covered	\N	18	Consumable	20mm Clamp	t	f	2026-06-03 12:31:56.270392	2026-06-03 12:31:56.270403	59	\N	PLB0008
2044	3	3	MAT-01116	20mm Brass Elbow CPVC	60	46	5	48	189	2380.55	\N	Covered	\N	18	Consumable	20mm Brass Elbow CPVC	t	f	2026-06-03 12:31:56.27278	2026-06-03 12:31:56.27279	59	\N	PLB0009
2045	3	3	MAT-01117	20mm Brass FTA (20x15mm) CPVC	60	46	5	11	43	2676	\N	Covered	\N	18	Consumable	20mm Brass FTA (20x15mm) CPVC	t	f	2026-06-03 12:31:56.275266	2026-06-03 12:31:56.275276	59	\N	PLB0010
2046	3	3	MAT-01118	Sink Mixcer (Jaguar)	60	46	5	16	59	3965.76	\N	Covered	\N	18	Consumable	Sink Mixcer (Jaguar)	t	f	2026-06-03 12:31:56.277901	2026-06-03 12:31:56.277915	59	\N	PLB0011
2047	3	3	MAT-01119	20mm FTA CPVC	60	46	5	22	57	3029.26	\N	Covered	\N	18	Consumable	20mm FTA CPVC	t	f	2026-06-03 12:31:56.280773	2026-06-03 12:31:56.280784	59	\N	PLB0012
2048	3	3	MAT-01120	25x20mm Elbow CPVC	60	46	5	29	83	1855.31	\N	Covered	\N	18	Consumable	25x20mm Elbow CPVC	t	f	2026-06-03 12:31:56.283157	2026-06-03 12:31:56.283167	59	\N	PLB0013
2049	3	3	MAT-01121	15mm Plug	60	46	5	19	68	2724.67	\N	Covered	\N	18	Consumable	15mm Plug	t	f	2026-06-03 12:31:56.285442	2026-06-03 12:31:56.285452	59	\N	PLB0014
2050	3	3	MAT-01122	25mm End Cape CPVC	60	46	5	12	34	2348.97	\N	Covered	\N	18	Consumable	25mm End Cape CPVC	t	f	2026-06-03 12:31:56.287737	2026-06-03 12:31:56.287747	59	\N	PLB0015
2051	3	3	MAT-01123	25x20mm Reducer CPVC	60	46	5	41	96	2583.12	\N	Covered	\N	18	Consumable	25x20mm Reducer CPVC	t	f	2026-06-03 12:31:56.290001	2026-06-03 12:31:56.290011	59	\N	PLB0016
2052	3	3	MAT-01124	25x20mm Bush CPVC	60	46	5	45	139	4715.86	\N	Covered	\N	18	Consumable	25x20mm Bush CPVC	t	f	2026-06-03 12:31:56.292575	2026-06-03 12:31:56.292585	59	\N	PLB0017
2053	3	3	MAT-01125	25mm 45° Bend CPVC	60	46	5	11	43	4052.12	\N	Covered	\N	18	Consumable	25mm 45° Bend CPVC	t	f	2026-06-03 12:31:56.295266	2026-06-03 12:31:56.29528	59	\N	PLB0018
2054	3	3	MAT-01126	25mm Ball Valve CPVC	60	46	5	49	175	1164.36	\N	Covered	\N	18	Consumable	25mm Ball Valve CPVC	t	f	2026-06-03 12:31:56.297936	2026-06-03 12:31:56.297946	59	\N	PLB0019
2055	3	3	MAT-01127	25mm Coupler CPVC	60	46	5	47	180	3648.08	\N	Covered	\N	18	Consumable	25mm Coupler CPVC	t	f	2026-06-03 12:31:56.300456	2026-06-03 12:31:56.300466	59	\N	PLB0020
2056	3	3	MAT-01128	25mm Tee CPVC	60	46	5	310	1123	302.44	\N	Covered	\N	18	Consumable	25mm Tee CPVC	t	f	2026-06-03 12:31:56.302766	2026-06-03 12:31:56.302776	59	\N	PLB0021
2057	3	3	MAT-01129	25mm Elbow CPVC	60	46	5	26	84	4466.46	\N	Covered	\N	18	Consumable	25mm Elbow CPVC	t	f	2026-06-03 12:31:56.305026	2026-06-03 12:31:56.305036	59	\N	PLB0022
2058	3	3	MAT-01130	25x20 Tee CPVC	60	46	5	432	965	100.04	\N	Covered	\N	18	Consumable	25x20 Tee CPVC	t	f	2026-06-03 12:31:56.30735	2026-06-03 12:31:56.307361	59	\N	PLB0023
2059	3	3	MAT-01131	25mm FTA	60	46	5	202	598	297.73	\N	Covered	\N	18	Consumable	25mm FTA	t	f	2026-06-03 12:31:56.309756	2026-06-03 12:31:56.309766	59	\N	PLB0024
2060	3	3	MAT-01132	25mm Long Bend	60	46	5	33	91	4270.89	\N	Covered	\N	18	Consumable	25mm Long Bend	t	f	2026-06-03 12:31:56.31256	2026-06-03 12:31:56.312574	59	\N	PLB0025
2061	3	3	MAT-01133	25mm Clamp	60	46	5	102	279	342.59	\N	Covered	\N	18	Consumable	25mm Clamp	t	f	2026-06-03 12:31:56.315201	2026-06-03 12:31:56.315211	59	\N	PLB0026
2062	3	3	MAT-01134	25mm MTA	60	46	5	282	1077	518.03	\N	Covered	\N	18	Consumable	25mm MTA	t	f	2026-06-03 12:31:56.318229	2026-06-03 12:31:56.31824	59	\N	PLB0027
2063	3	3	MAT-01135	20x15mm Brass Tee	60	46	5	347	1193	923.38	\N	Covered	\N	18	Consumable	20x15mm Brass Tee	t	f	2026-06-03 12:31:56.320574	2026-06-03 12:31:56.320584	59	\N	PLB0028
2064	3	3	MAT-01136	25mm Union	60	46	5	84	259	874.17	\N	Covered	\N	18	Consumable	25mm Union	t	f	2026-06-03 12:31:56.322892	2026-06-03 12:31:56.322902	59	\N	PLB0029
2065	3	3	MAT-01137	40mm End Cap	60	46	5	24	80	3636.31	\N	Covered	\N	18	Consumable	40mm End Cap	t	f	2026-06-03 12:31:56.325343	2026-06-03 12:31:56.325353	59	\N	PLB0030
2066	3	3	MAT-01138	40x25mm Tee	60	46	5	32	105	3650.91	\N	Covered	\N	18	Consumable	40x25mm Tee	t	f	2026-06-03 12:31:56.32787	2026-06-03 12:31:56.327883	59	\N	PLB0031
2067	3	3	MAT-01139	40mm 45° Bend CPVC	60	46	5	50	195	2786.47	\N	Covered	\N	18	Consumable	40mm 45° Bend CPVC	t	f	2026-06-03 12:31:56.330798	2026-06-03 12:31:56.330809	59	\N	PLB0032
2068	3	3	MAT-01140	40mm Ball Volve CPVC	60	46	5	97	244	943.5	\N	Covered	\N	18	Consumable	40mm Ball Volve CPVC	t	f	2026-06-03 12:31:56.333194	2026-06-03 12:31:56.333204	59	\N	PLB0033
2069	3	3	MAT-01141	40mm Coupler CPVC	60	46	5	186	430	630.23	\N	Covered	\N	18	Consumable	40mm Coupler CPVC	t	f	2026-06-03 12:31:56.335484	2026-06-03 12:31:56.335494	59	\N	PLB0034
2070	3	3	MAT-01142	40mm Long Bend	60	46	5	33	71	2576.76	\N	Covered	\N	18	Consumable	40mm Long Bend	t	f	2026-06-03 12:31:56.337773	2026-06-03 12:31:56.337783	59	\N	PLB0035
2071	3	3	MAT-01143	40mm Tank Nipple	60	46	5	234	823	187.95	\N	Covered	\N	18	Consumable	40mm Tank Nipple	t	f	2026-06-03 12:31:56.339953	2026-06-03 12:31:56.339963	59	\N	PLB0036
2072	3	3	MAT-01144	40mm FTA	60	46	5	38	98	1262.61	\N	Covered	\N	18	Consumable	40mm FTA	t	f	2026-06-03 12:31:56.342444	2026-06-03 12:31:56.342455	59	\N	PLB0037
2073	3	3	MAT-01145	40mm MTA	60	46	5	28	66	1695.7	\N	Covered	\N	18	Consumable	40mm MTA	t	f	2026-06-03 12:31:56.34515	2026-06-03 12:31:56.345164	59	\N	PLB0038
2074	3	3	MAT-01146	40mm Elbow	60	46	5	107	260	675.91	\N	Covered	\N	18	Consumable	40mm Elbow	t	f	2026-06-03 12:31:56.348023	2026-06-03 12:31:56.348033	59	\N	PLB0039
2075	3	3	MAT-01147	40x32mm Reducer	60	46	5	20	51	2174.17	\N	Covered	\N	18	Consumable	40x32mm Reducer	t	f	2026-06-03 12:31:56.350488	2026-06-03 12:31:56.350499	59	\N	PLB0040
2076	3	3	MAT-01148	40x25mm Reducer	60	46	5	10	22	4797.46	\N	Covered	\N	18	Consumable	40x25mm Reducer	t	f	2026-06-03 12:31:56.352856	2026-06-03 12:31:56.352865	59	\N	PLB0041
2077	3	3	MAT-01149	40mm Union	60	46	5	47	142	3502.63	\N	Covered	\N	18	Consumable	40mm Union	t	f	2026-06-03 12:31:56.355164	2026-06-03 12:31:56.355174	59	\N	PLB0042
2078	3	3	MAT-01150	50x40 Reducer	60	46	5	217	833	460.36	\N	Covered	\N	18	Consumable	50x40 Reducer	t	f	2026-06-03 12:31:56.357472	2026-06-03 12:31:56.357483	59	\N	PLB0043
2079	3	3	MAT-01151	50mm MTA	60	46	5	164	354	515.4	\N	Covered	\N	18	Consumable	50mm MTA	t	f	2026-06-03 12:31:56.359976	2026-06-03 12:31:56.359986	59	\N	PLB0044
2080	3	3	MAT-01152	40mm Tee	60	46	5	495	1206	99.66	\N	Covered	\N	18	Consumable	40mm Tee	t	f	2026-06-03 12:31:56.36275	2026-06-03 12:31:56.362764	59	\N	PLB0045
2081	3	3	MAT-01153	50mm End Cap	60	46	5	275	953	402.63	\N	Covered	\N	18	Consumable	50mm End Cap	t	f	2026-06-03 12:31:56.365467	2026-06-03 12:31:56.365477	59	\N	PLB0046
2082	3	3	MAT-01154	Solvent 250ml CPVC	60	46	5	57	178	886.81	\N	Covered	\N	18	Consumable	Solvent 250ml CPVC	t	f	2026-06-03 12:31:56.367807	2026-06-03 12:31:56.367816	59	\N	PLB0047
2083	3	3	MAT-01155	Solvent 1Ltr CPVC	60	46	5	25	96	2744.39	\N	Covered	\N	18	Consumable	Solvent 1Ltr CPVC	t	f	2026-06-03 12:31:56.370137	2026-06-03 12:31:56.370147	59	\N	PLB0048
2085	3	3	MAT-01157	50mm FTA	60	46	5	50	158	4605.41	\N	Covered	\N	18	Consumable	50mm FTA	t	f	2026-06-03 12:31:56.374849	2026-06-03 12:31:56.37486	59	\N	PLB0050
2086	3	3	MAT-01158	25mm Nipple	60	46	5	38	128	4305.65	\N	Covered	\N	18	Consumable	25mm Nipple	t	f	2026-06-03 12:31:56.37734	2026-06-03 12:31:56.377352	59	\N	PLB0051
2087	3	3	MAT-01159	50mm Long Bend	60	46	5	33	132	1279.19	\N	Covered	\N	18	Consumable	50mm Long Bend	t	f	2026-06-03 12:31:56.380272	2026-06-03 12:31:56.380284	59	\N	PLB0052
2088	3	3	MAT-01160	50mm Coupler	60	46	5	337	900	176.83	\N	Covered	\N	18	Consumable	50mm Coupler	t	f	2026-06-03 12:31:56.382779	2026-06-03 12:31:56.382789	59	\N	PLB0053
2089	3	3	MAT-01161	50mm Union	60	46	5	42	122	3345.13	\N	Covered	\N	18	Consumable	50mm Union	t	f	2026-06-03 12:31:56.385127	2026-06-03 12:31:56.385137	59	\N	PLB0054
2090	3	3	MAT-01162	Health Faucet	60	46	5	33	82	3221.71	\N	Covered	\N	18	Consumable	Health Faucet	t	f	2026-06-03 12:31:56.387436	2026-06-03 12:31:56.387446	59	\N	PLB0055
2091	3	3	MAT-01163	Filter RO	60	46	5	30	68	2015.07	\N	Covered	\N	18	Consumable	Filter RO	t	f	2026-06-03 12:31:56.389738	2026-06-03 12:31:56.389748	59	\N	PLB0056
2092	3	3	MAT-01164	Pillar cock loong body	60	46	5	47	120	3470.74	\N	Covered	\N	18	Consumable	Pillar cock loong body	t	f	2026-06-03 12:31:56.392179	2026-06-03 12:31:56.39219	59	\N	PLB0057
2093	3	3	MAT-01165	32mm Waste Coupling	60	46	5	13	45	4967.59	\N	Covered	\N	18	Consumable	32mm Waste Coupling	t	f	2026-06-03 12:31:56.394744	2026-06-03 12:31:56.394757	59	\N	PLB0058
2094	3	3	MAT-01166	63mm End Cape PVC	60	46	5	31	115	1316.58	\N	Covered	\N	18	Consumable	63mm End Cape PVC	t	f	2026-06-03 12:31:56.39769	2026-06-03 12:31:56.397701	59	\N	PLB0059
2095	3	3	MAT-01167	110mm End Cape PVC	60	46	5	273	703	874.87	\N	Covered	\N	18	Consumable	110mm End Cape PVC	t	f	2026-06-03 12:31:56.400105	2026-06-03 12:31:56.400115	59	\N	PLB0060
2096	3	3	MAT-01168	75mm Tee PVC	60	46	5	17	49	2059.31	\N	Covered	\N	18	Consumable	75mm Tee PVC	t	f	2026-06-03 12:31:56.402498	2026-06-03 12:31:56.402508	59	\N	PLB0061
2097	3	3	MAT-01169	75mm  45° Bend PVC	60	46	5	50	158	3446.88	\N	Covered	\N	18	Consumable	75mm  45° Bend PVC	t	f	2026-06-03 12:31:56.404789	2026-06-03 12:31:56.404799	59	\N	PLB0062
2098	3	3	MAT-01170	50mm  45° Bend PVC	60	46	5	50	167	3508.68	\N	Covered	\N	18	Consumable	50mm  45° Bend PVC	t	f	2026-06-03 12:31:56.407098	2026-06-03 12:31:56.407108	59	\N	PLB0063
2099	3	3	MAT-01171	90mm Coupler PVC	60	46	5	46	161	4353.77	\N	Covered	\N	18	Consumable	90mm Coupler PVC	t	f	2026-06-03 12:31:56.409618	2026-06-03 12:31:56.409628	59	\N	PLB0064
2100	3	3	MAT-01172	75mm Door Bend PVC	60	46	5	37	90	1357.41	\N	Covered	\N	18	Consumable	75mm Door Bend PVC	t	f	2026-06-03 12:31:56.41235	2026-06-03 12:31:56.412364	59	\N	PLB0065
2101	3	3	MAT-01173	110mm Elbow PVC	60	46	5	15	49	1416.91	\N	Covered	\N	18	Consumable	110mm Elbow PVC	t	f	2026-06-03 12:31:56.415132	2026-06-03 12:31:56.415141	59	\N	PLB0066
2102	3	3	MAT-01174	110 Door Bend PVC	60	46	5	24	50	3262.58	\N	Covered	\N	18	Consumable	110 Door Bend PVC	t	f	2026-06-03 12:31:56.417475	2026-06-03 12:31:56.417485	59	\N	PLB0067
2103	3	3	MAT-01175	110 Door Tee PVC	60	46	5	33	73	4602.71	\N	Covered	\N	18	Consumable	110 Door Tee PVC	t	f	2026-06-03 12:31:56.419762	2026-06-03 12:31:56.419772	59	\N	PLB0068
2104	3	3	MAT-01176	Connection pipe PVC	60	46	5	41	127	3135.57	\N	Covered	\N	18	Consumable	Connection pipe PVC	t	f	2026-06-03 12:31:56.422152	2026-06-03 12:31:56.422162	59	\N	PLB0069
2105	3	3	MAT-01177	90x75mm Reducer/40mm Long Bend PVC	60	46	5	12	39	2110.53	\N	Covered	\N	18	Consumable	90x75mm Reducer/40mm Long Bend PVC	t	f	2026-06-03 12:31:56.424735	2026-06-03 12:31:56.424747	59	\N	PLB0070
2106	3	3	MAT-01178	40mm  45° Bend PVC	60	46	5	28	111	2074.01	\N	Covered	\N	18	Consumable	40mm  45° Bend PVC	t	f	2026-06-03 12:31:56.427569	2026-06-03 12:31:56.42758	59	\N	PLB0071
2107	3	3	MAT-01179	75mm Elbow PVC	60	46	5	25	88	1454.36	\N	Covered	\N	18	Consumable	75mm Elbow PVC	t	f	2026-06-03 12:31:56.430623	2026-06-03 12:31:56.430635	59	\N	PLB0072
2108	3	3	MAT-01180	63mm Elbow PVC	60	46	5	16	55	3448.45	\N	Covered	\N	18	Consumable	63mm Elbow PVC	t	f	2026-06-03 12:31:56.433089	2026-06-03 12:31:56.433099	59	\N	PLB0073
2109	3	3	MAT-01181	50mm Elbow PVC	60	46	5	38	147	3109.68	\N	Covered	\N	18	Consumable	50mm Elbow PVC	t	f	2026-06-03 12:31:56.43543	2026-06-03 12:31:56.435439	59	\N	PLB0074
2110	3	3	MAT-01182	40mm Elbow PVC	60	46	5	40	103	4655.73	\N	Covered	\N	18	Consumable	40mm Elbow PVC	t	f	2026-06-03 12:31:56.4377	2026-06-03 12:31:56.437709	59	\N	PLB0075
2111	3	3	MAT-01183	50mm Coller PVC	60	46	5	39	137	1229.46	\N	Covered	\N	18	Consumable	50mm Coller PVC	t	f	2026-06-03 12:31:56.439971	2026-06-03 12:31:56.439981	59	\N	PLB0076
2112	3	3	MAT-01184	63mm Coller PVC	60	46	5	16	58	1441.97	\N	Covered	\N	18	Consumable	63mm Coller PVC	t	f	2026-06-03 12:31:56.442424	2026-06-03 12:31:56.442435	59	\N	PLB0077
2113	3	3	MAT-01185	75mm Coller PVC	60	46	5	11	26	1646.08	\N	Covered	\N	18	Consumable	75mm Coller PVC	t	f	2026-06-03 12:31:56.444964	2026-06-03 12:31:56.444977	59	\N	PLB0078
2114	3	3	MAT-01186	63x50 Reducer PVC	60	46	5	10	35	3528.92	\N	Covered	\N	18	Consumable	63x50 Reducer PVC	t	f	2026-06-03 12:31:56.44789	2026-06-03 12:31:56.447901	59	\N	PLB0079
2115	3	3	MAT-01187	50mm Ball Valve PVC	60	46	5	49	117	1185.64	\N	Covered	\N	18	Consumable	50mm Ball Valve PVC	t	f	2026-06-03 12:31:56.450289	2026-06-03 12:31:56.450299	59	\N	PLB0080
2116	3	3	MAT-01188	63mm Ball Valve PVC	60	46	5	30	110	2018.42	\N	Covered	\N	18	Consumable	63mm Ball Valve PVC	t	f	2026-06-03 12:31:56.452661	2026-06-03 12:31:56.452671	59	\N	PLB0081
2117	3	3	MAT-01189	75mm Ball Valve PVC	60	46	5	458	1662	586.47	\N	Covered	\N	18	Consumable	75mm Ball Valve PVC	t	f	2026-06-03 12:31:56.454978	2026-06-03 12:31:56.454987	59	\N	PLB0082
2118	3	3	MAT-01190	50mm MTA PVC	60	46	5	27	55	4868.63	\N	Covered	\N	18	Consumable	50mm MTA PVC	t	f	2026-06-03 12:31:56.457311	2026-06-03 12:31:56.457321	59	\N	PLB0083
2119	3	3	MAT-01191	50mm FTA PVC	60	46	5	411	1644	378.91	\N	Covered	\N	18	Consumable	50mm FTA PVC	t	f	2026-06-03 12:31:56.459815	2026-06-03 12:31:56.459824	59	\N	PLB0084
2120	3	3	MAT-01192	110mmx75mm Multi trap PVC	60	46	5	42	151	3477.26	\N	Covered	\N	18	Consumable	110mmx75mm Multi trap PVC	t	f	2026-06-03 12:31:56.462516	2026-06-03 12:31:56.462531	59	\N	PLB0085
2121	3	3	MAT-01193	63mm FTA PVC	60	46	5	11	29	4016.98	\N	Covered	\N	18	Consumable	63mm FTA PVC	t	f	2026-06-03 12:31:56.465351	2026-06-03 12:31:56.465361	59	\N	PLB0086
2122	3	3	MAT-01194	50mm Tee UPVC	60	46	5	11	30	4554.59	\N	Covered	\N	18	Consumable	50mm Tee UPVC	t	f	2026-06-03 12:31:56.467711	2026-06-03 12:31:56.467721	59	\N	PLB0087
2123	3	3	MAT-01195	50mm FTA UPVC	60	46	5	17	61	3698.73	\N	Covered	\N	18	Consumable	50mm FTA UPVC	t	f	2026-06-03 12:31:56.470015	2026-06-03 12:31:56.470024	59	\N	PLB0088
2124	3	3	MAT-01196	50mm MTA UPVC	60	46	5	21	59	3236.67	\N	Covered	\N	18	Consumable	50mm MTA UPVC	t	f	2026-06-03 12:31:56.47231	2026-06-03 12:31:56.472321	59	\N	PLB0089
2125	3	3	MAT-01197	40mm Tee UPVC	60	46	5	44	152	4819.1	\N	Covered	\N	18	Consumable	40mm Tee UPVC	t	f	2026-06-03 12:31:56.474662	2026-06-03 12:31:56.474673	59	\N	PLB0090
2126	3	3	MAT-01198	25mm Coller UPVC	60	46	5	88	280	299.05	\N	Covered	\N	18	Consumable	25mm Coller UPVC	t	f	2026-06-03 12:31:56.47714	2026-06-03 12:31:56.477151	59	\N	PLB0091
2127	3	3	MAT-01199	25mm MTA UPVC	60	46	5	12	36	3321.92	\N	Covered	\N	18	Consumable	25mm MTA UPVC	t	f	2026-06-03 12:31:56.480186	2026-06-03 12:31:56.4802	59	\N	PLB0092
2128	3	3	MAT-01200	20mm Tank NippleUPVC	60	46	5	22	70	2572.92	\N	Covered	\N	18	Consumable	20mm Tank NippleUPVC	t	f	2026-06-03 12:31:56.4828	2026-06-03 12:31:56.48281	59	\N	PLB0093
2129	3	3	MAT-01201	110mm Coller PVC	60	46	5	14	55	4379.25	\N	Covered	\N	18	Consumable	110mm Coller PVC	t	f	2026-06-03 12:31:56.485133	2026-06-03 12:31:56.485143	59	\N	PLB0094
2130	3	3	MAT-01202	75mm Door Tee	60	46	5	23	68	2763.31	\N	Covered	\N	18	Consumable	75mm Door Tee	t	f	2026-06-03 12:31:56.487428	2026-06-03 12:31:56.487437	59	\N	PLB0095
2131	3	3	MAT-01203	110mm Door Tee	60	46	5	30	81	1051.65	\N	Covered	\N	18	Consumable	110mm Door Tee	t	f	2026-06-03 12:31:56.489741	2026-06-03 12:31:56.489751	59	\N	PLB0096
2132	3	3	MAT-01204	110mmx75mm Floor trap	60	46	5	31	64	2319.88	\N	Covered	\N	18	Consumable	110mmx75mm Floor trap	t	f	2026-06-03 12:31:56.492234	2026-06-03 12:31:56.492245	59	\N	PLB0097
2133	3	3	MAT-01205	110mmx75mm Bush	60	46	5	448	1626	761.41	\N	Covered	\N	18	Consumable	110mmx75mm Bush	t	f	2026-06-03 12:31:56.494755	2026-06-03 12:31:56.494766	59	\N	PLB0098
2134	3	3	MAT-01206	110mmx75mm Nani Trap	60	46	5	42	161	2188.78	\N	Covered	\N	18	Consumable	110mmx75mm Nani Trap	t	f	2026-06-03 12:31:56.497816	2026-06-03 12:31:56.497828	59	\N	PLB0099
2135	3	3	MAT-01207	10*8 AGFA FILMS	61	47	5	34	118	4349	\N	Covered	\N	12	Consumable	10*8 AGFA FILMS	t	f	2026-06-03 12:31:56.500343	2026-06-03 12:31:56.500353	59	\N	RAD0001
2136	3	3	MAT-01208	17*14AGFA FILMS	61	47	5	11	23	1685.06	\N	Covered	\N	12	Consumable	17*14AGFA FILMS	t	f	2026-06-03 12:31:56.50273	2026-06-03 12:31:56.50274	59	\N	RAD0002
2137	3	3	MAT-01209	RADIOLOGY LETTER HEAD	61	47	5	485	1444	167.16	\N	Covered	\N	12	Consumable	RADIOLOGY LETTER HEAD	t	f	2026-06-03 12:31:56.505006	2026-06-03 12:31:56.505016	59	\N	RAD0003
2138	3	3	MAT-01210	RADIOLOGY REGISTER	61	47	5	14	38	3535.54	\N	Covered	\N	12	Consumable	RADIOLOGY REGISTER	t	f	2026-06-03 12:31:56.507306	2026-06-03 12:31:56.507316	59	\N	RAD0004
2139	3	3	MAT-01211	SONY THERMOL PAPER TYPE 1--BOX	61	47	5	20	51	2204.32	\N	Covered	\N	12	Consumable	SONY THERMOL PAPER TYPE 1--BOX	t	f	2026-06-03 12:31:56.509816	2026-06-03 12:31:56.509826	59	\N	RAD0005
2140	3	3	MAT-01212	ZIP LOCK COVERS - LARGE SIZE	62	53	5	461	1635	494.89	\N	Covered	\N	18	Consumable	ZIP LOCK COVERS - LARGE SIZE	t	f	2026-06-03 12:31:56.512489	2026-06-03 12:31:56.512503	51	\N	STY0001
2141	3	3	MAT-01213	ZIP LOCK COVERS - MEDIUM SIZE	62	53	5	191	716	154.39	\N	Covered	\N	18	Consumable	ZIP LOCK COVERS - MEDIUM SIZE	t	f	2026-06-03 12:31:56.515359	2026-06-03 12:31:56.515369	51	\N	STY0002
2142	3	3	MAT-01214	ZIP LOCK COVERS - SMALL SIZE	62	53	5	486	1750	79.03	\N	Covered	\N	18	Consumable	ZIP LOCK COVERS - SMALL SIZE	t	f	2026-06-03 12:31:56.51771	2026-06-03 12:31:56.51772	51	\N	STY0003
2143	3	3	MAT-01215	BROWN COVER LARGE	62	52	5	326	1236	350.71	\N	Covered	\N	12	Consumable	BROWN COVER LARGE	t	f	2026-06-03 12:31:56.520028	2026-06-03 12:31:56.520037	51	\N	STY0004
2144	3	3	MAT-01216	BROWN COVER MEDIUM	62	52	5	76	230	170.62	\N	Covered	\N	12	Consumable	BROWN COVER MEDIUM	t	f	2026-06-03 12:31:56.522352	2026-06-03 12:31:56.522362	51	\N	STY0005
2145	3	3	MAT-01217	BROWN COVER SMALL	62	52	5	56	213	495.35	\N	Covered	\N	12	Consumable	BROWN COVER SMALL	t	f	2026-06-03 12:31:56.524717	2026-06-03 12:31:56.524728	51	\N	STY0006
2146	3	3	MAT-01218	PHARMACY CARRY CLOTH COVER- MEDIUM	62	52	5	361	855	127.69	\N	Covered	\N	12	Consumable	PHARMACY CARRY CLOTH COVER- MEDIUM	t	f	2026-06-03 12:31:56.527311	2026-06-03 12:31:56.527322	51	\N	STY0007
2147	3	3	MAT-01219	PLASTIC TRAY 16X12 GREEN COLOUR	62	50	5	420	1004	316.87	\N	Covered	\N	18	Consumable	PLASTIC TRAY 16X12 GREEN COLOUR	t	f	2026-06-03 12:31:56.530157	2026-06-03 12:31:56.53017	51	\N	STY0008
2148	3	3	MAT-01220	PLASTIC TRAY 16X12 TRANSPARENT	62	50	5	394	949	36.55	\N	Covered	\N	18	Consumable	PLASTIC TRAY 16X12 TRANSPARENT	t	f	2026-06-03 12:31:56.532857	2026-06-03 12:31:56.532868	51	\N	STY0009
2149	3	3	MAT-01221	PLASTIC TRAY 18X14 GREEN COLOUR	62	50	5	356	856	14.02	\N	Covered	\N	18	Consumable	PLASTIC TRAY 18X14 GREEN COLOUR	t	f	2026-06-03 12:31:56.535248	2026-06-03 12:31:56.535258	51	\N	STY0010
2150	3	3	MAT-01222	ACTIVITY CHART	62	53	5	319	836	187.86	\N	Covered	\N	12	Consumable	ACTIVITY CHART	t	f	2026-06-03 12:31:56.537519	2026-06-03 12:31:56.537529	51	\N	STY0011
2151	3	3	MAT-01223	ACTIVITY RECORD FOR BILLING	62	53	5	419	1175	109.13	\N	Covered	\N	12	Consumable	ACTIVITY RECORD FOR BILLING	t	f	2026-06-03 12:31:56.539814	2026-06-03 12:31:56.539823	51	\N	STY0012
2152	3	3	MAT-01224	ADMISSION REGISTRER NURSING COLLEGE	62	53	5	67	168	221.31	\N	Covered	\N	12	Consumable	ADMISSION REGISTRER NURSING COLLEGE	t	f	2026-06-03 12:31:56.542146	2026-06-03 12:31:56.542156	51	\N	STY0013
2153	3	3	MAT-01225	BROWN ENVOLOP SMALL	62	53	5	415	923	369.91	\N	Covered	\N	12	Consumable	BROWN ENVOLOP SMALL	t	f	2026-06-03 12:31:56.544717	2026-06-03 12:31:56.544728	51	\N	STY0014
2154	3	3	MAT-01226	BUTTON FILE	62	53	5	351	1158	323.81	\N	Covered	\N	12	Consumable	BUTTON FILE	t	f	2026-06-03 12:31:56.547695	2026-06-03 12:31:56.547707	51	\N	STY0015
2155	3	3	MAT-01227	CANDLE BIG	62	53	5	388	1056	70.95	\N	Covered	\N	12	Consumable	CANDLE BIG	t	f	2026-06-03 12:31:56.550213	2026-06-03 12:31:56.550223	51	\N	STY0016
2156	3	3	MAT-01228	CATHLAB NURSES REPORT	62	53	5	304	650	263.91	\N	Covered	\N	12	Consumable	CATHLAB NURSES REPORT	t	f	2026-06-03 12:31:56.552643	2026-06-03 12:31:56.552653	51	\N	STY0017
2157	3	3	MAT-01229	CAUTI SURVELLIANCE FORM	62	53	5	376	1157	352.36	\N	Covered	\N	12	Consumable	CAUTI SURVELLIANCE FORM	t	f	2026-06-03 12:31:56.554977	2026-06-03 12:31:56.554989	51	\N	STY0018
2158	3	3	MAT-01230	CENTRAL LAB STOCK REGISTER	62	51	5	342	691	261.17	\N	Covered	\N	12	Consumable	CENTRAL LAB STOCK REGISTER	t	f	2026-06-03 12:31:56.557324	2026-06-03 12:31:56.557334	51	\N	STY0019
2159	3	3	MAT-01231	CENTRAL STORE INDENT BOOK	62	53	5	309	1205	150.88	\N	Covered	\N	12	Consumable	CENTRAL STORE INDENT BOOK	t	f	2026-06-03 12:31:56.559927	2026-06-03 12:31:56.559937	51	\N	STY0020
2160	3	3	MAT-01232	CHECKLIST FOR DIALYSIS (STATION ROUTINE DISINFECTION)	62	53	5	244	692	427.89	\N	Covered	\N	12	Consumable	CHECKLIST FOR DIALYSIS (STATION ROUTINE DISINFECTION)	t	f	2026-06-03 12:31:56.562572	2026-06-03 12:31:56.562585	51	\N	STY0021
2161	3	3	MAT-01233	CMO REPORT BOOK	62	53	5	179	502	377.65	\N	Covered	\N	12	Consumable	CMO REPORT BOOK	t	f	2026-06-03 12:31:56.565409	2026-06-03 12:31:56.565419	51	\N	STY0022
2162	3	3	MAT-01234	CONSENT FOR HIV	62	53	5	229	880	340.08	\N	Covered	\N	12	Consumable	CONSENT FOR HIV	t	f	2026-06-03 12:31:56.567785	2026-06-03 12:31:56.567796	51	\N	STY0023
2163	3	3	MAT-01235	CREDIT SHEET	62	53	5	491	1291	307.6	\N	Covered	\N	12	Consumable	CREDIT SHEET	t	f	2026-06-03 12:31:56.570182	2026-06-03 12:31:56.570192	51	\N	STY0024
2164	3	3	MAT-01236	CROSS MATCHING REGISTER	62	53	5	185	572	28.32	\N	Covered	\N	12	Consumable	CROSS MATCHING REGISTER	t	f	2026-06-03 12:31:56.572491	2026-06-03 12:31:56.572501	51	\N	STY0025
2165	3	3	MAT-01237	CYTOLOGY REQUEST FORM	62	53	5	451	1370	345.44	\N	Covered	\N	12	Consumable	CYTOLOGY REQUEST FORM	t	f	2026-06-03 12:31:56.574961	2026-06-03 12:31:56.574983	51	\N	STY0026
2166	3	3	MAT-01238	DEPARTMENT OF RADIOLOGY AND IMAGING	62	53	5	342	1350	13.35	\N	Covered	\N	12	Consumable	DEPARTMENT OF RADIOLOGY AND IMAGING	t	f	2026-06-03 12:31:56.57753	2026-06-03 12:31:56.57754	51	\N	STY0027
2167	3	3	MAT-01239	DIABETIC CHART	62	53	5	307	644	161.02	\N	Covered	\N	12	Consumable	DIABETIC CHART	t	f	2026-06-03 12:31:56.580279	2026-06-03 12:31:56.580291	51	\N	STY0028
2168	3	3	MAT-01240	DIALYSIS MONTHLY CHECKLIST	62	53	5	151	593	470.13	\N	Covered	\N	12	Consumable	DIALYSIS MONTHLY CHECKLIST	t	f	2026-06-03 12:31:56.583102	2026-06-03 12:31:56.583113	51	\N	STY0029
2169	3	3	MAT-01241	DONOR REGISTER BB	62	53	5	306	698	262.12	\N	Covered	\N	12	Consumable	DONOR REGISTER BB	t	f	2026-06-03 12:31:56.58544	2026-06-03 12:31:56.58545	51	\N	STY0030
2170	3	3	MAT-01242	EDAN ECG PAPER (A4 SIZE) 210MM X 295MM	62	53	5	246	548	431.26	\N	Covered	\N	12	Consumable	EDAN ECG PAPER (A4 SIZE) 210MM X 295MM	t	f	2026-06-03 12:31:56.587748	2026-06-03 12:31:56.587757	51	\N	STY0031
2171	3	3	MAT-01243	EL LEAVE APPLICATION FORM	62	53	5	498	1401	134.95	\N	Covered	\N	12	Consumable	EL LEAVE APPLICATION FORM	t	f	2026-06-03 12:31:56.590049	2026-06-03 12:31:56.590058	51	\N	STY0032
2172	3	3	MAT-01244	ADMISSION FORM EMERGENERALCY MEDICINE DEPARTMENT	62	53	5	115	341	329.65	\N	Covered	\N	12	Consumable	ADMISSION FORM EMERGENERALCY MEDICINE DEPARTMENT	t	f	2026-06-03 12:31:56.592417	2026-06-03 12:31:56.592428	51	\N	STY0033
2173	3	3	MAT-01245	EMERGENERALCY MEDICINE REGISTER	62	53	5	73	264	470.5	\N	Covered	\N	12	Consumable	EMERGENERALCY MEDICINE REGISTER	t	f	2026-06-03 12:31:56.594833	2026-06-03 12:31:56.594844	51	\N	STY0034
2174	3	3	MAT-01246	ENVOLOP COVER 14*17	62	53	5	466	1106	378.15	\N	Covered	\N	12	Consumable	ENVOLOP COVER 14*17	t	f	2026-06-03 12:31:56.597743	2026-06-03 12:31:56.597755	51	\N	STY0035
2175	3	3	MAT-01247	ENVOLOP COVER 4*10	62	53	5	468	1541	325.57	\N	Covered	\N	12	Consumable	ENVOLOP COVER 4*10	t	f	2026-06-03 12:31:56.600271	2026-06-03 12:31:56.600281	51	\N	STY0036
2176	3	3	MAT-01248	ENVOLOP COVER 8*10	62	53	5	384	1065	427.03	\N	Covered	\N	12	Consumable	ENVOLOP COVER 8*10	t	f	2026-06-03 12:31:56.602619	2026-06-03 12:31:56.602629	51	\N	STY0037
2177	3	3	MAT-01249	GLOSSY SHEET	62	53	5	470	1554	212.43	\N	Covered	\N	18	Consumable	GLOSSY SHEET	t	f	2026-06-03 12:31:56.604922	2026-06-03 12:31:56.604931	51	\N	STY0038
2178	3	3	MAT-01250	HAEMODIALYSIS TREATMENT CHART	62	53	5	91	297	312	\N	Covered	\N	12	Consumable	HAEMODIALYSIS TREATMENT CHART	t	f	2026-06-03 12:31:56.60723	2026-06-03 12:31:56.60724	51	\N	STY0039
2179	3	3	MAT-01251	HELIOS CONSTRUCTION LETTERHEAD	62	53	5	198	702	394.82	\N	Covered	\N	12	Consumable	HELIOS CONSTRUCTION LETTERHEAD	t	f	2026-06-03 12:31:56.609749	2026-06-03 12:31:56.609759	51	\N	STY0040
2180	3	3	MAT-01252	MLC REGISTER	62	49	5	255	885	305.91	\N	Covered	\N	12	Consumable	MLC REGISTER	t	f	2026-06-03 12:31:56.612325	2026-06-03 12:31:56.612339	51	\N	STY0041
2181	3	3	MAT-01253	CROSS MATCHING REPORT	62	48	5	315	1064	135.62	\N	Covered	\N	12	Consumable	CROSS MATCHING REPORT	t	f	2026-06-03 12:31:56.615241	2026-06-03 12:31:56.615252	51	\N	STY0042
2182	3	3	MAT-01254	REPORTING OF TRANSFUSION REACTION WORK UP FORM	62	48	5	419	1391	171.24	\N	Covered	\N	12	Consumable	REPORTING OF TRANSFUSION REACTION WORK UP FORM	t	f	2026-06-03 12:31:56.617692	2026-06-03 12:31:56.617702	51	\N	STY0043
2183	3	3	MAT-01255	NST MACHINE - PRINT PAPER (EDAN)	62	53	5	444	1007	399.15	\N	Covered	\N	12	Consumable	NST MACHINE - PRINT PAPER (EDAN)	t	f	2026-06-03 12:31:56.620016	2026-06-03 12:31:56.620026	51	\N	STY0044
2184	3	3	MAT-01256	MY DIALYSIS TRACKER	62	53	5	200	666	364.96	\N	Covered	\N	12	Consumable	MY DIALYSIS TRACKER	t	f	2026-06-03 12:31:56.622344	2026-06-03 12:31:56.622354	51	\N	STY0045
2185	3	3	MAT-01257	PARTURATION REGISTER	62	53	5	168	485	122.73	\N	Covered	\N	12	Consumable	PARTURATION REGISTER	t	f	2026-06-03 12:31:56.624686	2026-06-03 12:31:56.624696	51	\N	STY0046
2186	3	3	MAT-01258	PATHOLOGY REGISTER	62	53	5	411	1007	48.41	\N	Covered	\N	12	Consumable	PATHOLOGY REGISTER	t	f	2026-06-03 12:31:56.627303	2026-06-03 12:31:56.627313	51	\N	STY0047
2187	3	3	MAT-01259	PATHOLOGY REQUEST FORM	62	53	5	280	818	96.42	\N	Covered	\N	12	Consumable	PATHOLOGY REQUEST FORM	t	f	2026-06-03 12:31:56.630076	2026-06-03 12:31:56.630097	51	\N	STY0048
2188	3	3	MAT-01260	PEN STAND	62	53	5	408	1591	363.89	\N	Covered	\N	18	Consumable	PEN STAND	t	f	2026-06-03 12:31:56.632954	2026-06-03 12:31:56.632965	51	\N	STY0049
2189	3	3	MAT-01261	SCISSOR 210MM	62	53	5	382	928	407.39	\N	Covered	\N	12	Consumable	SCISSOR 210MM	t	f	2026-06-03 12:31:56.635383	2026-06-03 12:31:56.635393	51	\N	STY0050
2190	3	3	MAT-01262	VISITORS PASS	62	53	5	169	599	113.79	\N	Covered	\N	12	Consumable	VISITORS PASS	t	f	2026-06-03 12:31:56.637701	2026-06-03 12:31:56.637711	51	\N	STY0051
2191	3	3	MAT-01263	WHITE ENVELOP COVER (10.5 X 4.5)	62	53	5	243	519	413.46	\N	Covered	\N	12	Consumable	WHITE ENVELOP COVER (10.5 X 4.5)	t	f	2026-06-03 12:31:56.640147	2026-06-03 12:31:56.640157	51	\N	STY0052
2192	3	3	MAT-01264	WHITE THREAD	62	53	5	471	1356	56.94	\N	Covered	\N	5	Consumable	WHITE THREAD	t	f	2026-06-03 12:31:56.642598	2026-06-03 12:31:56.642608	51	\N	STY0053
2193	3	3	MAT-01265	XO BLUE PEN	62	53	5	403	875	383.07	\N	Covered	\N	12	Consumable	XO BLUE PEN	t	f	2026-06-03 12:31:56.645127	2026-06-03 12:31:56.645139	51	\N	STY0054
2194	3	3	MAT-01266	BIOCHEMISTRY REQUEST FORM	62	53	5	493	1344	451.57	\N	Covered	\N	12	Consumable	BIOCHEMISTRY REQUEST FORM	t	f	2026-06-03 12:31:56.648076	2026-06-03 12:31:56.648099	51	\N	STY0055
2195	3	3	MAT-01267	400 PAGES NOTE BOOK	62	53	5	104	330	140.64	\N	Covered	\N	12	Consumable	400 PAGES NOTE BOOK	t	f	2026-06-03 12:31:56.650699	2026-06-03 12:31:56.65071	51	\N	STY0056
2196	3	3	MAT-01268	A4 PAPERLINE HI-GRADE PREMIUM PAPER 70GSM - REAM	62	53	5	398	814	323.61	\N	Covered	\N	12	Consumable	A4 PAPERLINE HI-GRADE PREMIUM PAPER 70GSM - REAM	t	f	2026-06-03 12:31:56.653317	2026-06-03 12:31:56.653328	51	\N	STY0057
2197	3	3	MAT-01269	AA CELL - DURACEL	62	53	5	229	910	47.27	\N	Covered	\N	18	Consumable	AA CELL - DURACEL	t	f	2026-06-03 12:31:56.655963	2026-06-03 12:31:56.655973	51	\N	STY0058
2198	3	3	MAT-01270	AAA CELL- DURACEL	62	53	5	357	1263	230.46	\N	Covered	\N	18	Consumable	AAA CELL- DURACEL	t	f	2026-06-03 12:31:56.658702	2026-06-03 12:31:56.658717	51	\N	STY0059
2199	3	3	MAT-01271	ALL PIN	62	53	5	410	1039	146.09	\N	Covered	\N	12	Consumable	ALL PIN	t	f	2026-06-03 12:31:56.661398	2026-06-03 12:31:56.661409	51	\N	STY0060
2200	3	3	MAT-01272	ATTENDANCE REGISTER 1Q	62	53	5	232	531	353.15	\N	Covered	\N	12	Consumable	ATTENDANCE REGISTER 1Q	t	f	2026-06-03 12:31:56.66442	2026-06-03 12:31:56.664433	51	\N	STY0061
2201	3	3	MAT-01273	ATTENDANCE REGISTER 2Q	62	53	5	312	643	158.47	\N	Covered	\N	12	Consumable	ATTENDANCE REGISTER 2Q	t	f	2026-06-03 12:31:56.667046	2026-06-03 12:31:56.667056	51	\N	STY0062
2202	3	3	MAT-01274	ATTENDENCE REGISTER SMALL	62	53	5	438	1320	180.36	\N	Covered	\N	12	Consumable	ATTENDENCE REGISTER SMALL	t	f	2026-06-03 12:31:56.669392	2026-06-03 12:31:56.669402	51	\N	STY0063
2203	3	3	MAT-01275	BATTERIES  9 V	62	53	5	362	1369	106.09	\N	Covered	\N	18	Consumable	BATTERIES  9 V	t	f	2026-06-03 12:31:56.671684	2026-06-03 12:31:56.671694	51	\N	STY0064
2204	3	3	MAT-01276	BATTERIES LARENZSCOPE	62	53	5	146	581	293.61	\N	Covered	\N	18	Consumable	BATTERIES LARENZSCOPE	t	f	2026-06-03 12:31:56.673985	2026-06-03 12:31:56.673995	51	\N	STY0065
2205	3	3	MAT-01277	BLOOD DONOR QUESTIONNAIRE AND CONSENT FORM	62	53	5	396	914	39.22	\N	Covered	\N	12	Consumable	BLOOD DONOR QUESTIONNAIRE AND CONSENT FORM	t	f	2026-06-03 12:31:56.67653	2026-06-03 12:31:56.676541	51	\N	STY0066
2206	3	3	MAT-01278	BOARD PIN COLOUR	62	53	5	414	1652	315.22	\N	Covered	\N	12	Consumable	BOARD PIN COLOUR	t	f	2026-06-03 12:31:56.678951	2026-06-03 12:31:56.678963	51	\N	STY0067
2207	3	3	MAT-01279	BOX FILE BIG	62	53	5	348	1197	356.36	\N	Covered	\N	12	Consumable	BOX FILE BIG	t	f	2026-06-03 12:31:56.681968	2026-06-03 12:31:56.681979	51	\N	STY0068
2208	3	3	MAT-01280	BROWN TAPE 2"	62	53	5	444	892	231.61	\N	Covered	\N	18	Consumable	BROWN TAPE 2"	t	f	2026-06-03 12:31:56.684451	2026-06-03 12:31:56.684461	51	\N	STY0069
2209	3	3	MAT-01281	CALCULATOR	62	53	5	471	1522	349.22	\N	Covered	\N	18	Consumable	CALCULATOR	t	f	2026-06-03 12:31:56.686758	2026-06-03 12:31:56.686768	51	\N	STY0070
2210	3	3	MAT-01282	CALLING BELL	62	53	5	349	850	332.52	\N	Covered	\N	18	Consumable	CALLING BELL	t	f	2026-06-03 12:31:56.689013	2026-06-03 12:31:56.689023	51	\N	STY0071
2211	3	3	MAT-01283	CARBON PAPER	62	53	5	414	1364	272.24	\N	Covered	\N	12	Consumable	CARBON PAPER	t	f	2026-06-03 12:31:56.691323	2026-06-03 12:31:56.691333	51	\N	STY0072
2212	3	3	MAT-01284	CARDIOLOGY CONSENT FORM	62	53	5	437	971	140.82	\N	Covered	\N	5	Consumable	CARDIOLOGY CONSENT FORM	t	f	2026-06-03 12:31:56.693828	2026-06-03 12:31:56.693838	51	\N	STY0073
2213	3	3	MAT-01285	CD MARKER PENS - BLACK	62	53	5	172	403	399.27	\N	Covered	\N	5	Consumable	CD MARKER PENS - BLACK	t	f	2026-06-03 12:31:56.696481	2026-06-03 12:31:56.696495	51	\N	STY0074
2214	3	3	MAT-01286	CD MARKER PENS - BLUE	62	53	5	444	1460	271.39	\N	Covered	\N	5	Consumable	CD MARKER PENS - BLUE	t	f	2026-06-03 12:31:56.699366	2026-06-03 12:31:56.699376	51	\N	STY0075
2215	3	3	MAT-01287	CELLO TAPE 1" 65MTRS	62	53	5	274	794	246.84	\N	Covered	\N	5	Consumable	CELLO TAPE 1" 65MTRS	t	f	2026-06-03 12:31:56.701744	2026-06-03 12:31:56.701754	51	\N	STY0076
2216	3	3	MAT-01288	CELLO TAPE 2" 65MTRS	62	53	5	359	1251	227.18	\N	Covered	\N	5	Consumable	CELLO TAPE 2" 65MTRS	t	f	2026-06-03 12:31:56.704063	2026-06-03 12:31:56.704073	51	\N	STY0077
2217	3	3	MAT-01289	CHALK COLOUR	62	53	5	406	1274	318.94	\N	Covered	\N	5	Consumable	CHALK COLOUR	t	f	2026-06-03 12:31:56.706369	2026-06-03 12:31:56.70638	51	\N	STY0078
2218	3	3	MAT-01290	CLOTH COVER GREEN- A4 SIZE	62	53	5	498	1095	29.56	\N	Covered	\N	5	Consumable	CLOTH COVER GREEN- A4 SIZE	t	f	2026-06-03 12:31:56.708724	2026-06-03 12:31:56.708736	51	\N	STY0079
2219	3	3	MAT-01291	CLOTH COVER GREEN- A3 SIZE	62	53	5	393	1424	228.34	\N	Covered	\N	5	Consumable	CLOTH COVER GREEN- A3 SIZE	t	f	2026-06-03 12:31:56.711257	2026-06-03 12:31:56.711267	51	\N	STY0080
2220	3	3	MAT-01292	CORRECTION PEN	62	53	5	287	1052	476.08	\N	Covered	\N	5	Consumable	CORRECTION PEN	t	f	2026-06-03 12:31:56.714058	2026-06-03 12:31:56.714076	51	\N	STY0081
2221	3	3	MAT-01293	DVD-R	62	53	5	166	360	16.46	\N	Covered	\N	18	Consumable	DVD-R	t	f	2026-06-03 12:31:56.716718	2026-06-03 12:31:56.716728	51	\N	STY0082
2222	3	3	MAT-01294	EAST POINT HOSPITAL LOGO BLUE PEN	62	53	5	75	294	226.91	\N	Covered	\N	5	Consumable	EAST POINT HOSPITAL LOGO BLUE PEN	t	f	2026-06-03 12:31:56.719072	2026-06-03 12:31:56.719089	51	\N	STY0083
2223	3	3	MAT-01295	EMERGENERALCY EXTERNAL TRANSFER	62	53	5	117	444	383.07	\N	Covered	\N	18	Consumable	EMERGENERALCY EXTERNAL TRANSFER	t	f	2026-06-03 12:31:56.721392	2026-06-03 12:31:56.721402	51	\N	STY0084
2224	3	3	MAT-01296	EMERGENERALCY DISCHARGE SUMMAR	62	53	5	480	1846	238.45	\N	Covered	\N	5	Consumable	EMERGENERALCY DISCHARGE SUMMAR	t	f	2026-06-03 12:31:56.72374	2026-06-03 12:31:56.72375	51	\N	STY0085
2225	3	3	MAT-01297	EMERGENERALCY PROCEDURE CONSENT FORM	62	53	5	114	431	338.7	\N	Covered	\N	5	Consumable	EMERGENERALCY PROCEDURE CONSENT FORM	t	f	2026-06-03 12:31:56.726216	2026-06-03 12:31:56.726227	51	\N	STY0086
2226	3	3	MAT-01298	ENVOLOP 13*9 (ENDOSCOPY)	62	53	5	116	398	117.63	\N	Covered	\N	5	Consumable	ENVOLOP 13*9 (ENDOSCOPY)	t	f	2026-06-03 12:31:56.728744	2026-06-03 12:31:56.728756	51	\N	STY0087
2227	3	3	MAT-01299	EP ACTIVITY CHART EMERGENERALCY MEDICINE	62	53	5	251	792	385.78	\N	Covered	\N	5	Consumable	EP ACTIVITY CHART EMERGENERALCY MEDICINE	t	f	2026-06-03 12:31:56.731666	2026-06-03 12:31:56.731678	51	\N	STY0088
2228	3	3	MAT-01300	EP CONSENT FORM PAEDIATRIC NIC DEPT	62	53	5	228	683	213.44	\N	Covered	\N	5	Consumable	EP CONSENT FORM PAEDIATRIC NIC DEPT	t	f	2026-06-03 12:31:56.734185	2026-06-03 12:31:56.734195	51	\N	STY0089
2229	3	3	MAT-01301	EP FAP LOGBOOK COMMUNITY MEDICINE	62	53	5	301	637	348.2	\N	Covered	\N	5	Consumable	EP FAP LOGBOOK COMMUNITY MEDICINE	t	f	2026-06-03 12:31:56.736523	2026-06-03 12:31:56.736533	51	\N	STY0090
2230	3	3	MAT-01302	EP HIGH RISK CONSENT FORM PAEDIATRIC DEPT	62	53	5	305	1127	35.13	\N	Covered	\N	5	Consumable	EP HIGH RISK CONSENT FORM PAEDIATRIC DEPT	t	f	2026-06-03 12:31:56.738957	2026-06-03 12:31:56.73897	51	\N	STY0091
2231	3	3	MAT-01303	EP PG DERMATOLOGY VENEREOLOGY AND LEPROSY	62	53	5	285	634	147.67	\N	Covered	\N	5	Consumable	EP PG DERMATOLOGY VENEREOLOGY AND LEPROSY	t	f	2026-06-03 12:31:56.741375	2026-06-03 12:31:56.741385	51	\N	STY0092
2232	3	3	MAT-01304	EP PHYSIOTHERAPY LOG INTERNSHIP	62	53	5	211	705	92.84	\N	Covered	\N	5	Consumable	EP PHYSIOTHERAPY LOG INTERNSHIP	t	f	2026-06-03 12:31:56.744031	2026-06-03 12:31:56.744041	51	\N	STY0093
2233	3	3	MAT-01305	EP STOCK REGISTER	62	53	5	307	1147	26.94	\N	Covered	\N	5	Consumable	EP STOCK REGISTER	t	f	2026-06-03 12:31:56.746701	2026-06-03 12:31:56.746714	51	\N	STY0094
2234	3	3	MAT-01306	ERASER	62	53	5	409	1283	29.13	\N	Covered	\N	5	Consumable	ERASER	t	f	2026-06-03 12:31:56.749571	2026-06-03 12:31:56.749582	51	\N	STY0095
2235	3	3	MAT-01307	EVEREADY BATTERY - BIG	62	53	5	382	1076	272.71	\N	Covered	\N	18	Consumable	EVEREADY BATTERY - BIG	t	f	2026-06-03 12:31:56.751962	2026-06-03 12:31:56.751972	51	\N	STY0096
2236	3	3	MAT-01308	FEVI KWIK	62	53	5	167	431	157.8	\N	Covered	\N	18	Consumable	FEVI KWIK	t	f	2026-06-03 12:31:56.754375	2026-06-03 12:31:56.754385	51	\N	STY0097
2237	3	3	MAT-01309	FEVICOL 100G	62	53	5	277	762	274.11	\N	Covered	\N	18	Consumable	FEVICOL 100G	t	f	2026-06-03 12:31:56.756691	2026-06-03 12:31:56.756701	51	\N	STY0098
2238	3	3	MAT-01310	FEVICOL TUBE	62	53	5	367	829	314.6	\N	Covered	\N	18	Consumable	FEVICOL TUBE	t	f	2026-06-03 12:31:56.759072	2026-06-03 12:31:56.75909	51	\N	STY0099
2239	3	3	MAT-01311	FROM REGISTER	62	53	5	104	243	35.57	\N	Covered	\N	5	Consumable	FROM REGISTER	t	f	2026-06-03 12:31:56.761535	2026-06-03 12:31:56.761545	51	\N	STY0100
2240	3	3	MAT-01312	GLUE STICK BIG	62	53	5	194	536	317.47	\N	Covered	\N	18	Consumable	GLUE STICK BIG	t	f	2026-06-03 12:31:56.764383	2026-06-03 12:31:56.764397	51	\N	STY0101
2241	3	3	MAT-01313	GLUE STICK SMALL	62	53	5	259	851	40.64	\N	Covered	\N	18	Consumable	GLUE STICK SMALL	t	f	2026-06-03 12:31:56.767052	2026-06-03 12:31:56.767062	51	\N	STY0102
2242	3	3	MAT-01314	GREEN PENS	62	53	5	229	566	169.53	\N	Covered	\N	5	Consumable	GREEN PENS	t	f	2026-06-03 12:31:56.769422	2026-06-03 12:31:56.769431	51	\N	STY0103
2243	3	3	MAT-01315	HAEMODIALYSIS RECORD	62	53	5	165	517	313.34	\N	Covered	\N	5	Consumable	HAEMODIALYSIS RECORD	t	f	2026-06-03 12:31:56.771751	2026-06-03 12:31:56.771761	51	\N	STY0104
2244	3	3	MAT-01316	HIGH LIGHTER	62	53	5	284	1136	498.22	\N	Covered	\N	5	Consumable	HIGH LIGHTER	t	f	2026-06-03 12:31:56.774143	2026-06-03 12:31:56.774153	51	\N	STY0105
2245	3	3	MAT-01317	IN PATIENT FEED BACK FORM	62	53	5	490	1732	36.96	\N	Covered	\N	5	Consumable	IN PATIENT FEED BACK FORM	t	f	2026-06-03 12:31:56.776615	2026-06-03 12:31:56.776626	51	\N	STY0106
2246	3	3	MAT-01318	INK PAD	62	53	5	69	245	199.16	\N	Covered	\N	18	Consumable	INK PAD	t	f	2026-06-03 12:31:56.779205	2026-06-03 12:31:56.779218	51	\N	STY0107
2247	3	3	MAT-01319	JUMP CLIP - BOX	62	53	5	309	633	341.1	\N	Covered	\N	18	Consumable	JUMP CLIP - BOX	t	f	2026-06-03 12:31:56.782131	2026-06-03 12:31:56.782142	51	\N	STY0108
2248	3	3	MAT-01320	LONG NOTE BOOK 200PGS HARD BIND - CHANDRA	62	53	5	247	677	394.82	\N	Covered	\N	5	Consumable	LONG NOTE BOOK 200PGS HARD BIND - CHANDRA	t	f	2026-06-03 12:31:56.784585	2026-06-03 12:31:56.784595	51	\N	STY0109
2249	3	3	MAT-01321	LONG NOTE BOOK SOFT (200PGS) CHANDRA	62	53	5	416	1539	168.37	\N	Covered	\N	5	Consumable	LONG NOTE BOOK SOFT (200PGS) CHANDRA	t	f	2026-06-03 12:31:56.786923	2026-06-03 12:31:56.786933	51	\N	STY0110
2250	3	3	MAT-01322	LONG SCALE PLASTIC	62	53	5	330	1318	191.08	\N	Covered	\N	18	Consumable	LONG SCALE PLASTIC	t	f	2026-06-03 12:31:56.78925	2026-06-03 12:31:56.789259	51	\N	STY0111
2251	3	3	MAT-01323	MEDICAL COLLEGE LETTER HEAD	62	53	5	464	1284	77.17	\N	Covered	\N	5	Consumable	MEDICAL COLLEGE LETTER HEAD	t	f	2026-06-03 12:31:56.791586	2026-06-03 12:31:56.791595	51	\N	STY0112
2252	3	3	MAT-01324	NATARAJ BALL PENS - BLUE	62	53	5	135	428	368.63	\N	Covered	\N	5	Consumable	NATARAJ BALL PENS - BLUE	t	f	2026-06-03 12:31:56.794176	2026-06-03 12:31:56.794186	51	\N	STY0113
2253	3	3	MAT-01325	NATARAJ BALL PENS - RED	62	53	5	242	908	355.93	\N	Covered	\N	5	Consumable	NATARAJ BALL PENS - RED	t	f	2026-06-03 12:31:56.796846	2026-06-03 12:31:56.796859	51	\N	STY0114
2254	3	3	MAT-01326	NOTE BOOK 100PG CHANDRA (SMALL)	62	53	5	385	1129	251.77	\N	Covered	\N	5	Consumable	NOTE BOOK 100PG CHANDRA (SMALL)	t	f	2026-06-03 12:31:56.799718	2026-06-03 12:31:56.799728	51	\N	STY0115
2255	3	3	MAT-01327	NOTICE BOARD PIN	62	53	5	379	1448	302.08	\N	Covered	\N	18	Consumable	NOTICE BOARD PIN	t	f	2026-06-03 12:31:56.802129	2026-06-03 12:31:56.802138	51	\N	STY0116
2256	3	3	MAT-01328	OPERATION RECORD NO.3	62	53	5	392	1534	497.84	\N	Covered	\N	5	Consumable	OPERATION RECORD NO.3	t	f	2026-06-03 12:31:56.80447	2026-06-03 12:31:56.80448	51	\N	STY0117
2257	3	3	MAT-01329	OUT PATIENT FEED BACK FORM	62	53	5	297	791	373.76	\N	Covered	\N	5	Consumable	OUT PATIENT FEED BACK FORM	t	f	2026-06-03 12:31:56.806811	2026-06-03 12:31:56.806821	51	\N	STY0118
2258	3	3	MAT-01330	PAPER CUTTING MACHINE	62	53	5	160	551	24.75	\N	Covered	\N	18	Consumable	PAPER CUTTING MACHINE	t	f	2026-06-03 12:31:56.809332	2026-06-03 12:31:56.809343	51	\N	STY0119
2259	3	3	MAT-01331	PAPER PIN BOX	62	53	5	321	1104	337.54	\N	Covered	\N	18	Consumable	PAPER PIN BOX	t	f	2026-06-03 12:31:56.811836	2026-06-03 12:31:56.811847	51	\N	STY0120
2260	3	3	MAT-01332	PEN BALL POINT BLACK	62	53	5	134	353	16.61	\N	Covered	\N	5	Consumable	PEN BALL POINT BLACK	t	f	2026-06-03 12:31:56.814773	2026-06-03 12:31:56.814785	51	\N	STY0121
2261	3	3	MAT-01333	PEN BALL POINT BLUE	62	53	5	247	820	478.2	\N	Covered	\N	5	Consumable	PEN BALL POINT BLUE	t	f	2026-06-03 12:31:56.817369	2026-06-03 12:31:56.817378	51	\N	STY0122
2262	3	3	MAT-01334	PEN BALL POINT RED	62	53	5	211	797	106.61	\N	Covered	\N	5	Consumable	PEN BALL POINT RED	t	f	2026-06-03 12:31:56.819745	2026-06-03 12:31:56.819754	51	\N	STY0123
2263	3	3	MAT-01335	PEN WHITE BOARD MARKER	62	53	5	487	1858	218.95	\N	Covered	\N	5	Consumable	PEN WHITE BOARD MARKER	t	f	2026-06-03 12:31:56.822091	2026-06-03 12:31:56.822101	51	\N	STY0124
2264	3	3	MAT-01336	PENCIL	62	53	5	252	574	341.94	\N	Covered	\N	5	Consumable	PENCIL	t	f	2026-06-03 12:31:56.824572	2026-06-03 12:31:56.824582	51	\N	STY0125
2265	3	3	MAT-01337	PERMANENT MARKER - BLACK	62	53	5	102	271	135.44	\N	Covered	\N	5	Consumable	PERMANENT MARKER - BLACK	t	f	2026-06-03 12:31:56.827022	2026-06-03 12:31:56.827032	51	\N	STY0126
2266	3	3	MAT-01338	PERMANENT MARKER - BLUE	62	53	5	163	422	343.78	\N	Covered	\N	5	Consumable	PERMANENT MARKER - BLUE	t	f	2026-06-03 12:31:56.829581	2026-06-03 12:31:56.829593	51	\N	STY0127
2267	3	3	MAT-01339	PHOTO PAPER 180 GSM	62	53	5	319	1101	70.04	\N	Covered	\N	18	Consumable	PHOTO PAPER 180 GSM	t	f	2026-06-03 12:31:56.832463	2026-06-03 12:31:56.832474	51	\N	STY0128
2268	3	3	MAT-01340	PLASTIC FOLDERS	62	53	5	116	367	428.3	\N	Covered	\N	5	Consumable	PLASTIC FOLDERS	t	f	2026-06-03 12:31:56.834929	2026-06-03 12:31:56.834939	51	\N	STY0129
2269	3	3	MAT-01341	PUNCHING MACHINE BIG - DP 500	62	53	5	323	979	378.71	\N	Covered	\N	18	Consumable	PUNCHING MACHINE BIG - DP 500	t	f	2026-06-03 12:31:56.837317	2026-06-03 12:31:56.837327	51	\N	STY0130
2270	3	3	MAT-01342	PUNCHING MACHINE SMALL	62	53	5	243	538	270.88	\N	Covered	\N	18	Consumable	PUNCHING MACHINE SMALL	t	f	2026-06-03 12:31:56.839669	2026-06-03 12:31:56.839679	51	\N	STY0131
2271	3	3	MAT-01343	REYNOLD BRITE PEN	62	53	5	154	369	290.87	\N	Covered	\N	5	Consumable	REYNOLD BRITE PEN	t	f	2026-06-03 12:31:56.841966	2026-06-03 12:31:56.841976	51	\N	STY0132
2272	3	3	MAT-01344	RUBBER BAND MEDIUM	62	53	5	90	262	265.62	\N	Covered	\N	18	Consumable	RUBBER BAND MEDIUM	t	f	2026-06-03 12:31:56.844563	2026-06-03 12:31:56.844574	51	\N	STY0133
2273	3	3	MAT-01345	SCALE SMALL	62	53	5	338	731	195.9	\N	Covered	\N	18	Consumable	SCALE SMALL	t	f	2026-06-03 12:31:56.847336	2026-06-03 12:31:56.84735	51	\N	STY0134
2274	3	3	MAT-01346	SCISSOR 165MM	62	53	5	430	1054	284.93	\N	Covered	\N	18	Consumable	SCISSOR 165MM	t	f	2026-06-03 12:31:56.850034	2026-06-03 12:31:56.850043	51	\N	STY0135
2275	3	3	MAT-01347	SCISSOR 210MM	62	53	5	409	1323	386.13	\N	Covered	\N	18	Consumable	SCISSOR 210MM	t	f	2026-06-03 12:31:56.852445	2026-06-03 12:31:56.852455	51	\N	STY0136
2276	3	3	MAT-01348	SEALING WAX	62	53	5	62	138	405.69	\N	Covered	\N	18	Consumable	SEALING WAX	t	f	2026-06-03 12:31:56.854821	2026-06-03 12:31:56.854831	51	\N	STY0137
2277	3	3	MAT-01349	BIO MEDICAL SERVICE REQUEST FORM	62	53	5	443	1329	343.64	\N	Covered	\N	5	Consumable	BIO MEDICAL SERVICE REQUEST FORM	t	f	2026-06-03 12:31:56.857142	2026-06-03 12:31:56.857151	51	\N	STY0138
2278	3	3	MAT-01350	SHARPENER	62	53	5	479	1709	248.93	\N	Covered	\N	5	Consumable	SHARPENER	t	f	2026-06-03 12:31:56.859535	2026-06-03 12:31:56.859546	51	\N	STY0139
2279	3	3	MAT-01351	SKETCH PEN - RED	62	53	5	126	408	73.54	\N	Covered	\N	5	Consumable	SKETCH PEN - RED	t	f	2026-06-03 12:31:56.862026	2026-06-03 12:31:56.862036	51	\N	STY0140
2280	3	3	MAT-01352	SKETCH PENS - BLACK	62	53	5	194	697	408.6	\N	Covered	\N	5	Consumable	SKETCH PENS - BLACK	t	f	2026-06-03 12:31:56.864941	2026-06-03 12:31:56.864954	51	\N	STY0141
2281	3	3	MAT-01353	SONY CD WITH COVER	62	53	5	432	1214	63.52	\N	Covered	\N	18	Consumable	SONY CD WITH COVER	t	f	2026-06-03 12:31:56.86754	2026-06-03 12:31:56.86755	51	\N	STY0142
2282	3	3	MAT-01354	SPRING FILE	62	53	5	439	1292	409.52	\N	Covered	\N	5	Consumable	SPRING FILE	t	f	2026-06-03 12:31:56.869922	2026-06-03 12:31:56.869932	51	\N	STY0143
2283	3	3	MAT-01355	STAMP PAD INK BIG	62	53	5	305	875	58.57	\N	Covered	\N	18	Consumable	STAMP PAD INK BIG	t	f	2026-06-03 12:31:56.872297	2026-06-03 12:31:56.872306	51	\N	STY0144
2284	3	3	MAT-01356	STAPLER HP 45	62	53	5	319	849	224.16	\N	Covered	\N	18	Consumable	STAPLER HP 45	t	f	2026-06-03 12:31:56.874676	2026-06-03 12:31:56.874686	51	\N	STY0145
2285	3	3	MAT-01357	STAPLER MACHINE BIG	62	53	5	430	1655	346.2	\N	Covered	\N	18	Consumable	STAPLER MACHINE BIG	t	f	2026-06-03 12:31:56.877162	2026-06-03 12:31:56.877173	51	\N	STY0146
2286	3	3	MAT-01358	STAPLER MACHINE SMALL	62	53	5	286	1063	206.85	\N	Covered	\N	18	Consumable	STAPLER MACHINE SMALL	t	f	2026-06-03 12:31:56.87979	2026-06-03 12:31:56.879804	51	\N	STY0147
2287	3	3	MAT-01359	STAPLER PIN REMOVER	62	53	5	50	130	298.23	\N	Covered	\N	18	Consumable	STAPLER PIN REMOVER	t	f	2026-06-03 12:31:56.882749	2026-06-03 12:31:56.882759	51	\N	STY0148
2288	3	3	MAT-01360	STAPLER PINS BIG	62	53	5	216	712	304.83	\N	Covered	\N	18	Consumable	STAPLER PINS BIG	t	f	2026-06-03 12:31:56.885214	2026-06-03 12:31:56.885224	51	\N	STY0149
2289	3	3	MAT-01361	STAPLER PINS SMALL	62	53	5	347	1024	107.74	\N	Covered	\N	18	Consumable	STAPLER PINS SMALL	t	f	2026-06-03 12:31:56.887569	2026-06-03 12:31:56.88758	51	\N	STY0150
2290	3	3	MAT-01362	STEEL SCALE	62	53	5	67	135	245.6	\N	Covered	\N	18	Consumable	STEEL SCALE	t	f	2026-06-03 12:31:56.889918	2026-06-03 12:31:56.889928	51	\N	STY0151
2291	3	3	MAT-01363	STOCK REGISTER WITH ALFABETIK 2Q	62	53	5	464	1085	53.27	\N	Covered	\N	5	Consumable	STOCK REGISTER WITH ALFABETIK 2Q	t	f	2026-06-03 12:31:56.89225	2026-06-03 12:31:56.89226	51	\N	STY0152
2292	3	3	MAT-01364	SURGICAL SAFETY CHECKLIST	62	53	5	319	915	421.23	\N	Covered	\N	5	Consumable	SURGICAL SAFETY CHECKLIST	t	f	2026-06-03 12:31:56.894764	2026-06-03 12:31:56.894775	51	\N	STY0153
2293	3	3	MAT-01365	SWIPING ROLL 5.5CMS	62	53	5	262	920	211.32	\N	Covered	\N	18	Consumable	SWIPING ROLL 5.5CMS	t	f	2026-06-03 12:31:56.897534	2026-06-03 12:31:56.897548	51	\N	STY0154
2294	3	3	MAT-01366	TEA CUPS	62	53	5	86	300	360.51	\N	Covered	\N	18	Consumable	TEA CUPS	t	f	2026-06-03 12:31:56.900342	2026-06-03 12:31:56.900352	51	\N	STY0155
2295	3	3	MAT-01367	TEXT BOOK	62	53	5	323	677	76.92	\N	Covered	\N	5	Consumable	TEXT BOOK	t	f	2026-06-03 12:31:56.902763	2026-06-03 12:31:56.902773	51	\N	STY0156
2296	3	3	MAT-01368	TISSUE PAPER	62	50	5	437	1245	347.94	\N	Covered	\N	18	Consumable	TISSUE PAPER	t	f	2026-06-03 12:31:56.905145	2026-06-03 12:31:56.905155	51	\N	STY0157
2297	3	3	MAT-01369	TO REGISTER	62	53	5	230	697	472.48	\N	Covered	\N	5	Consumable	TO REGISTER	t	f	2026-06-03 12:31:56.907494	2026-06-03 12:31:56.907504	51	\N	STY0158
2298	3	3	MAT-01370	WATER CUPS	62	53	5	378	778	51.54	\N	Covered	\N	18	Consumable	WATER CUPS	t	f	2026-06-03 12:31:56.910042	2026-06-03 12:31:56.910054	51	\N	STY0159
2299	3	3	MAT-01371	WHITE COVERS - A3	62	53	5	302	1058	198.7	\N	Covered	\N	5	Consumable	WHITE COVERS - A3	t	f	2026-06-03 12:31:56.912625	2026-06-03 12:31:56.912636	51	\N	STY0160
2300	3	3	MAT-01372	WHITE COVERS - A4	62	53	5	248	966	353.89	\N	Covered	\N	5	Consumable	WHITE COVERS - A4	t	f	2026-06-03 12:31:56.915646	2026-06-03 12:31:56.915659	51	\N	STY0161
2301	3	3	MAT-01373	WHITEBOARD MARKER PENS - BLACK	62	53	5	331	739	154.55	\N	Covered	\N	5	Consumable	WHITEBOARD MARKER PENS - BLACK	t	f	2026-06-03 12:31:56.918153	2026-06-03 12:31:56.918163	51	\N	STY0162
2302	3	3	MAT-01374	WHITEBOARD MARKER PENS - BLUE	62	53	5	330	1190	335.58	\N	Covered	\N	5	Consumable	WHITEBOARD MARKER PENS - BLUE	t	f	2026-06-03 12:31:56.920491	2026-06-03 12:31:56.9205	51	\N	STY0163
2303	3	3	MAT-01375	WHITENER	62	53	5	426	1414	38.69	\N	Covered	\N	18	Consumable	WHITENER	t	f	2026-06-03 12:31:56.922813	2026-06-03 12:31:56.922823	51	\N	STY0164
2304	3	3	MAT-01376	WOOD PEN RS.10	62	53	5	383	1300	217.47	\N	Covered	\N	5	Consumable	WOOD PEN RS.10	t	f	2026-06-03 12:31:56.925127	2026-06-03 12:31:56.925137	51	\N	STY0165
2305	3	3	MAT-01377	CONSENT FORM FOR FINE NEEDLE ASPIRATION CYTOLOOGY	62	53	5	242	956	345.54	\N	Covered	\N	5	Consumable	CONSENT FORM FOR FINE NEEDLE ASPIRATION CYTOLOOGY	t	f	2026-06-03 12:31:56.927568	2026-06-03 12:31:56.927578	51	\N	STY0166
2306	3	3	MAT-01378	MEDICATION RECONCILIATION FORM	62	53	5	353	775	205.69	\N	Covered	\N	5	Consumable	MEDICATION RECONCILIATION FORM	t	f	2026-06-03 12:31:56.930155	2026-06-03 12:31:56.930169	51	\N	STY0167
2307	3	3	MAT-01379	NURSES PRE-OPERATIVE & IMMEDIATE POST OPERATIVE CHECK LIST	62	53	5	401	1435	141.01	\N	Covered	\N	5	Consumable	NURSES PRE-OPERATIVE & IMMEDIATE POST OPERATIVE CHECK LIST	t	f	2026-06-03 12:31:56.933075	2026-06-03 12:31:56.933092	51	\N	STY0168
2308	3	3	MAT-01380	NICU INVESTIGATION CHART	62	53	5	169	442	440.35	\N	Covered	\N	5	Consumable	NICU INVESTIGATION CHART	t	f	2026-06-03 12:31:56.935502	2026-06-03 12:31:56.935512	51	\N	STY0169
2309	3	3	MAT-01381	PHYSIOTHERAPHY IP RECORD	62	53	5	127	327	205.38	\N	Covered	\N	5	Consumable	PHYSIOTHERAPHY IP RECORD	t	f	2026-06-03 12:31:56.937818	2026-06-03 12:31:56.937828	51	\N	STY0170
2310	3	3	MAT-01382	PHARMACY MANNUAL BOOK	62	53	5	129	421	341.54	\N	Covered	\N	5	Consumable	PHARMACY MANNUAL BOOK	t	f	2026-06-03 12:31:56.940153	2026-06-03 12:31:56.940163	51	\N	STY0171
2311	3	3	MAT-01383	RADIOLOGY CONSENT FORM	62	53	5	108	292	430.78	\N	Covered	\N	5	Consumable	RADIOLOGY CONSENT FORM	t	f	2026-06-03 12:31:56.942462	2026-06-03 12:31:56.942471	51	\N	STY0172
2312	3	3	MAT-01384	WOUND CERTIFICATE	62	53	5	466	1155	145.28	\N	Covered	\N	5	Consumable	WOUND CERTIFICATE	t	f	2026-06-03 12:31:56.945001	2026-06-03 12:31:56.94501	51	\N	STY0173
2313	3	3	MAT-01385	EXAM PAD	62	53	5	115	267	356.21	\N	Covered	\N	5	Consumable	EXAM PAD	t	f	2026-06-03 12:31:56.947741	2026-06-03 12:31:56.947755	51	\N	STY0174
2314	3	3	MAT-01386	GRAPH SHEET FOR STRESS TEST SYSTEM (TMT PAPER)	62	53	5	63	170	417.2	\N	Covered	\N	5	Consumable	GRAPH SHEET FOR STRESS TEST SYSTEM (TMT PAPER)	t	f	2026-06-03 12:31:56.95066	2026-06-03 12:31:56.95067	51	\N	STY0175
2315	3	3	MAT-01387	ICU ADMISSION CONSENT FORM	62	53	5	267	772	413.88	\N	Covered	\N	5	Consumable	ICU ADMISSION CONSENT FORM	t	f	2026-06-03 12:31:56.953059	2026-06-03 12:31:56.953068	51	\N	STY0176
2316	3	3	MAT-01388	INFORMED CONSENT FOR HIGH RISK SURGICAL PROCEDURES	62	53	5	308	1227	310.52	\N	Covered	\N	5	Consumable	INFORMED CONSENT FOR HIGH RISK SURGICAL PROCEDURES	t	f	2026-06-03 12:31:56.955419	2026-06-03 12:31:56.955428	51	\N	STY0177
2317	3	3	MAT-01389	DISCHARGE AGAINST MEDICAL ADVICE	62	53	5	248	606	416.15	\N	Covered	\N	5	Consumable	DISCHARGE AGAINST MEDICAL ADVICE	t	f	2026-06-03 12:31:56.957738	2026-06-03 12:31:56.957748	51	\N	STY0178
2318	3	3	MAT-01390	DAILY INVESTIGATION MASTER CHART	62	53	5	308	753	332.67	\N	Covered	\N	5	Consumable	DAILY INVESTIGATION MASTER CHART	t	f	2026-06-03 12:31:56.9601	2026-06-03 12:31:56.960111	51	\N	STY0179
2319	3	3	MAT-01391	DAILY QUALITY CONTROL FORM	62	53	5	456	1716	431.33	\N	Covered	\N	5	Consumable	DAILY QUALITY CONTROL FORM	t	f	2026-06-03 12:31:56.962581	2026-06-03 12:31:56.962592	51	\N	STY0180
2320	3	3	MAT-01392	DEATH CERTIFICATE	62	53	5	471	1215	378.48	\N	Covered	\N	5	Consumable	DEATH CERTIFICATE	t	f	2026-06-03 12:31:56.965535	2026-06-03 12:31:56.965548	51	\N	STY0181
2321	3	3	MAT-01393	BLOOD GROUPING REPORT	62	53	5	442	1034	387.96	\N	Covered	\N	5	Consumable	BLOOD GROUPING REPORT	t	f	2026-06-03 12:31:56.96813	2026-06-03 12:31:56.96814	51	\N	STY0182
2322	3	3	MAT-01394	CONSSENT FOR BLOOD AND BLOOD PRODUCT TRANSFUTION	62	53	5	328	1202	27.79	\N	Covered	\N	5	Consumable	CONSSENT FOR BLOOD AND BLOOD PRODUCT TRANSFUTION	t	f	2026-06-03 12:31:56.970402	2026-06-03 12:31:56.970412	51	\N	STY0183
2323	3	3	MAT-01395	PAEDIATRICS CASE SHEET	62	53	5	344	894	439.95	\N	Covered	\N	5	Consumable	PAEDIATRICS CASE SHEET	t	f	2026-06-03 12:31:56.972785	2026-06-03 12:31:56.972795	51	\N	STY0184
2324	3	3	MAT-01396	ADMISSION RECORD	62	53	5	107	402	278.06	\N	Covered	\N	5	Consumable	ADMISSION RECORD	t	f	2026-06-03 12:31:56.975105	2026-06-03 12:31:56.975115	51	\N	STY0185
2325	3	3	MAT-01397	CHILD IMMUNIZATION RECORD DEPT OF PAED	62	53	5	338	1210	103.8	\N	Covered	\N	5	Consumable	CHILD IMMUNIZATION RECORD DEPT OF PAED	t	f	2026-06-03 12:31:56.977607	2026-06-03 12:31:56.977618	51	\N	STY0186
2326	3	3	MAT-01398	ADMISSION & DISCHARGE SUMMARY	62	53	5	384	1307	320.05	\N	Covered	\N	5	Consumable	ADMISSION & DISCHARGE SUMMARY	t	f	2026-06-03 12:31:56.980128	2026-06-03 12:31:56.980141	51	\N	STY0187
2327	3	3	MAT-01399	ANAESTHESIA RECORD	62	53	5	192	433	238.83	\N	Covered	\N	5	Consumable	ANAESTHESIA RECORD	t	f	2026-06-03 12:31:56.983075	2026-06-03 12:31:56.983093	51	\N	STY0188
2328	3	3	MAT-01400	ECG REGISTER	62	53	5	457	1616	475.35	\N	Covered	\N	5	Consumable	ECG REGISTER	t	f	2026-06-03 12:31:56.98564	2026-06-03 12:31:56.98565	51	\N	STY0189
2329	3	3	MAT-01401	DEATH REGISTER	62	53	5	56	117	387.35	\N	Covered	\N	5	Consumable	DEATH REGISTER	t	f	2026-06-03 12:31:56.987943	2026-06-03 12:31:56.987952	51	\N	STY0190
2330	3	3	MAT-01402	BLOOD GROUPING REGISTER	62	53	5	187	692	483.48	\N	Covered	\N	5	Consumable	BLOOD GROUPING REGISTER	t	f	2026-06-03 12:31:56.990252	2026-06-03 12:31:56.990262	51	\N	STY0191
2331	3	3	MAT-01403	LIBRARY GATE REGISTER	62	53	5	63	141	484.46	\N	Covered	\N	5	Consumable	LIBRARY GATE REGISTER	t	f	2026-06-03 12:31:56.992575	2026-06-03 12:31:56.992586	51	\N	STY0192
2332	3	3	MAT-01404	BOX FILE SMALL	62	53	5	105	337	407.82	\N	Covered	\N	5	Consumable	BOX FILE SMALL	t	f	2026-06-03 12:31:56.995104	2026-06-03 12:31:56.995114	51	\N	STY0193
2333	3	3	MAT-01405	CARTRIDGE TK-7120	62	53	5	153	320	105.69	\N	Covered	\N	18	Consumable	CARTRIDGE TK-7120	t	f	2026-06-03 12:31:56.997835	2026-06-03 12:31:56.997848	51	\N	STY0194
2334	3	3	MAT-01406	CARTRIDGE 103A	62	53	5	233	588	34.8	\N	Covered	\N	18	Consumable	CARTRIDGE 103A	t	f	2026-06-03 12:31:57.000629	2026-06-03 12:31:57.000639	51	\N	STY0195
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

COPY public.purchase_order_items (id, po_id, material_id, quantity, rate, amount, received_quantity, remarks, discount_percent, cgst_percentage, sgst_percentage, igst_percentage, is_gst_inclusive) FROM stdin;
481	192	222	25	85	2507.5	0	\N	0	9	9	0	f
482	193	220	54	650	35100	0	\N	0	9	9	0	f
483	193	224	57	65000	3705000	0	\N	0	9	9	0	f
484	193	249	141	420	59220	0	\N	0	9	9	0	f
485	193	236	57	250	14250	0	\N	0	9	9	0	f
487	195	234	50	65	3250	0	\N	2	6	6	0	f
489	197	238	50	4500	225000	0	\N	0	9	9	0	f
429	170	218	58	622.66	36114.41	0	\N	0	0	0	0	f
430	170	239	91	253.69	23086.15	0	\N	0	0	0	0	f
431	171	232	65	798.18	51881.83	32.5	\N	0	0	0	0	f
432	171	240	56	696.88	39025.44	28	\N	0	0	0	0	f
433	172	246	84	197.82	16616.81	84	\N	0	0	0	0	f
434	172	238	97	253.34	24574.03	97	\N	0	0	0	0	f
435	173	230	62	192.3	11922.56	0	\N	0	0	0	0	f
436	173	243	90	994.43	89498.61	0	\N	0	0	0	0	f
437	173	238	71	806.76	57279.64	0	\N	0	0	0	0	f
438	174	224	71	334.92	23779.34	0	\N	0	0	0	0	f
439	174	246	56	508.97	28502.28	0	\N	0	0	0	0	f
440	174	242	95	439.57	41759.32	0	\N	0	0	0	0	f
441	175	232	74	675.81	50009.72	74	\N	0	0	0	0	f
442	175	246	89	634.26	56448.95	89	\N	0	0	0	0	f
443	176	232	85	594.08	50496.52	0	\N	0	0	0	0	f
444	176	247	64	701.45	44892.72	0	\N	0	0	0	0	f
445	176	228	83	711.34	59041.54	0	\N	0	0	0	0	f
446	177	218	74	647.16	47890.12	74	\N	0	0	0	0	f
447	177	225	91	191.78	17452.4	91	\N	0	0	0	0	f
448	178	233	95	935.31	88854.57	47.5	\N	0	0	0	0	f
449	178	234	92	432.83	39820.11	46	\N	0	0	0	0	f
492	200	224	2	100	200	0	\N	2	2	2	2	t
493	201	246	11	12111	133221	0	\N	2	2	2	0	f
495	203	246	10	1800	18000	0	\N	0	5	5	0	t
450	178	226	68	275.36	18724.56	34	\N	0	0	0	0	f
451	179	241	78	264.13	20602.24	0	\N	0	0	0	0	f
452	179	225	69	943.86	65126.52	0	\N	0	0	0	0	f
453	180	233	53	539.98	28618.86	26.5	\N	0	0	0	0	f
454	180	239	60	532.04	31922.63	30	\N	0	0	0	0	f
455	181	230	97	962.72	93383.37	97	\N	0	0	0	0	f
456	181	223	64	229.87	14711.78	64	\N	0	0	0	0	f
457	181	249	83	203.57	16896.71	83	\N	0	0	0	0	f
458	182	224	72	549.16	39539.86	36	\N	0	0	0	0	f
459	182	220	97	654.04	63441.88	48.5	\N	0	0	0	0	f
460	182	218	50	950.36	47518.08	25	\N	0	0	0	0	f
461	183	225	99	184.01	18217.39	0	\N	0	0	0	0	f
462	183	216	86	240.24	20660.79	0	\N	0	0	0	0	f
465	185	249	18	420	7560	0	\N	0	0	0	0	f
466	185	243	40	12000	480000	0	\N	0	0	0	0	f
467	185	249	43	420	18060	0	\N	0	0	0	0	f
468	186	234	150	65	9750	0	\N	0	0	0	0	f
469	186	226	200	950	190000	0	\N	0	0	0	0	f
470	186	239	200	1450	290000	0	\N	0	0	0	0	f
471	186	216	200	1200	240000	0	\N	0	0	0	0	f
472	186	238	100	6500	650000	0	\N	0	0	0	0	f
473	186	224	100	6500	650000	0	\N	0	0	0	0	f
474	187	224	100	65000	6500000	0	\N	0	0	0	0	f
475	188	216	100	70.57	7057	0	\N	0	0	0	0	f
477	190	236	50	250	12500	0	\N	0	9	9	0	f
478	190	247	63	250	15750	0	\N	0	9	9	0	f
479	190	238	105	65000	6825000	0	\N	0	9	9	0	f
480	191	244	2	550	1298	0	\N	0	9	9	0	f
486	194	219	120	800	100800	0	\N	0	2.5	2.5	0	f
488	196	219	300	800	226800	0	\N	10	2.5	2.5	0	f
490	198	242	100	204.38	20438	0	\N	0	9	9	0	f
491	199	230	100	20.42	2042	0	\N	0	9	9	0	f
494	202	244	5	1000	5605	0	\N	5	9	9	0	f
496	204	246	10	1800	18000	0	\N	0	5	5	0	f
463	184	246	93	501.93	46679.75	93	\N	0	0	0	0	f
464	184	232	54	647.48	34963.88	54	\N	0	0	0	0	f
476	189	224	100	336.29	33629	100	\N	0	0	0	0	f
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, tenant_id, site_id, po_number, vendor_id, project_id, pr_id, indent_id, qr_id, po_type, total_amount, delivery_date, status, terms, created_by_id, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
184	3	3	PO-00015	52	1	\N	\N	182	Formal	81643.63	\N	Closed	\N	4	\N	\N	f	2026-05-05 18:52:30.375564	2026-06-02 18:01:24.106204
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
185	3	3	PO-00020	56	1	\N	188	\N	Formal	505620	\N	Draft	\N	4	\N	\N	f	2026-05-20 11:09:40.396549	2026-05-20 11:09:40.431655
186	3	3	PO-00021	51	1	185	\N	\N	Formal	2029750	2026-06-03	Approved		4	4	2026-05-20 07:11:03.64198	f	2026-05-20 12:31:17.847185	2026-05-20 12:41:03.642637
187	3	3	PO-00022	59	1	\N	195	\N	Formal	6500000	\N	Draft	\N	4	\N	\N	f	2026-05-20 12:44:10.329878	2026-05-20 12:44:10.338882
188	3	3	PO-00023	53	1	\N	\N	179	Formal	7057	\N	Draft	\N	4	\N	\N	f	2026-05-25 18:43:27.659778	2026-05-25 18:43:27.678332
190	3	3	PO-00025	56	1	179	\N	\N	Formal	6853250	2026-06-15	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 15:23:31.597258	2026-06-01 15:23:31.66009
191	3	3	PO-00026	53	1	\N	197	\N	Formal	1298	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 16:03:23.716584	2026-06-01 16:03:23.728687
202	3	3	PO-00037	54	1	\N	200	\N	Formal	5605	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-02 13:18:45.56214	2026-06-02 13:18:45.624949
192	3	3	PO-00027	54	1	\N	196	\N	Formal	2507.5	\N	Sent to Vendor	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	4	2026-06-01 11:07:15.238732	f	2026-06-01 16:36:50.172223	2026-06-01 16:37:32.738439
193	3	3	PO-00028	57	1	178	\N	\N	Formal	3813570	2026-06-15	Draft		4	\N	\N	f	2026-06-01 16:39:26.934331	2026-06-01 16:39:26.948969
194	3	3	PO-00029	54	1	\N	201	\N	Formal	100800	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 16:58:23.591671	2026-06-01 16:58:23.603727
195	3	3	PO-00030	59	1	188	\N	\N	Formal	3250	2026-06-15	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 17:03:57.421434	2026-06-01 17:03:57.441155
196	3	3	PO-00031	53	1	\N	202	\N	Formal	226800	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 17:07:08.990299	2026-06-01 17:07:09.002256
197	3	3	PO-00032	53	1	187	\N	185	Formal	225000	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 17:32:30.423259	2026-06-01 17:32:30.438244
198	3	3	PO-00033	53	1	\N	\N	175	Formal	20438	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 17:37:01.162383	2026-06-01 17:37:01.172695
199	3	3	PO-00034	59	1	\N	\N	175	Formal	2042	\N	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-01 17:37:01.189809	2026-06-01 17:37:01.195657
203	3	3	PO-00038	53	1	\N	\N	\N	Informal	18000	2026-06-23	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-02 13:25:01.313929	2026-06-02 13:25:01.322517
201	3	3	PO-00036	54	1	\N	\N	\N	Formal	135778.84	2026-06-22	Approved	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	4	2026-06-02 06:00:37.696127	f	2026-06-01 19:53:47.799287	2026-06-02 11:30:37.696589
200	3	3	PO-00035	53	1	\N	\N	\N	Informal	196	2026-06-22	Approved	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	4	2026-06-02 06:01:19.439678	f	2026-06-01 19:52:04.979427	2026-06-02 11:31:19.444167
204	3	3	PO-00039	53	1	\N	\N	\N	Informal	19800	2026-06-23	Draft	1. Bill/Invoices in the name of EAST POINT HOSPITAL managed by M.G. Charitable Trust\n2. Delivery: Immediate\n3. Payments: After Delivery\n4. GST @ actuals\n5. Supply the same Make/Model provided in P.O.\n6. GST No.: 29AACTM0027H2ZR	4	\N	\N	f	2026-06-02 17:42:31.823143	2026-06-02 17:42:31.82497
189	3	3	PO-00024	54	1	\N	\N	179	Formal	33629	\N	Closed	\N	4	4	2026-05-25 13:22:18.605025	f	2026-05-25 18:43:27.751179	2026-06-02 18:01:36.986163
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
561	187	238	50
562	188	234	50
\.


--
-- Data for Name: purchase_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_requests (id, tenant_id, site_id, pr_number, requester_id, required_for_room_id, building_id, department_name, project_id, required_date, remarks, status, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
176	3	3	PR-00007	4	\N	2	Civil	1	2026-05-02	\N	Converted to PO	\N	\N	f	2026-04-22 18:52:30.375564	2026-05-15 18:52:30.43899
177	3	3	PR-00008	4	\N	2	Civil	1	2026-05-03	\N	Submitted	\N	\N	f	2026-04-23 18:52:30.375564	2026-05-15 18:52:30.442117
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
179	3	3	PR-00010	4	\N	2	Civil	1	2026-05-05	\N	Converted to PO	\N	\N	f	2026-04-25 18:52:30.375564	2026-06-01 15:23:31.656676
178	3	3	PR-00009	4	\N	3	Civil	1	2026-05-04	\N	Converted to PO	\N	\N	f	2026-04-24 18:52:30.375564	2026-06-01 16:39:26.947196
188	3	3	PR-00023	4	\N	1	CIVIL	1	2026-06-15		Converted to PO	4	2026-06-01 11:17:45.135642	f	2026-06-01 16:47:36.211265	2026-06-01 17:03:57.438438
187	3	3	PR-00022	4	\N	1	ADMIN	1	2026-06-15		Converted to PO	4	2026-06-01 11:17:10.199457	f	2026-06-01 16:47:00.870149	2026-06-01 17:32:30.435217
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
34	169	338	221	60	60	f	\N	\N	\N
35	169	339	218	60	60	f	\N	\N	\N
36	185	376	238	53	53	f	\N	4	2026-06-01 17:27:47.629964
37	182	364	218	56	56	f	\N	\N	\N
38	182	365	224	60	53	t	uy	\N	\N
39	181	362	241	59	59	f	\N	\N	\N
40	181	363	221	57	57	f	\N	\N	\N
41	174	348	235	52	52	f	\N	\N	\N
42	174	349	216	52	52	f	\N	\N	\N
\.


--
-- Data for Name: quotation_request_item_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_request_item_sources (id, qr_item_id, source, source_pr_id, quantity) FROM stdin;
6	366	PR	179	50
7	367	PR	179	63
8	368	PR	179	105
9	369	Manual	\N	1
10	370	Manual	\N	1
11	371	Manual	\N	1
12	372	PR	178	54
13	373	PR	178	57
14	374	PR	178	141
15	375	PR	178	57
16	376	PR	187	50
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
369	184	244	1	Manual	\N
370	184	226	1	Manual	\N
371	184	222	1	Manual	\N
372	184	220	54	PR	178
373	184	224	57	PR	178
374	184	249	141	PR	178
375	184	236	57	PR	178
376	185	238	50	PR	187
\.


--
-- Data for Name: quotation_request_prs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_request_prs (id, qr_id, pr_id) FROM stdin;
4	183	179
5	184	178
6	185	187
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
368	183	59	t	2026-06-01 16:27:13.198697	Pending
369	183	60	t	2026-06-01 16:27:13.198766	Pending
370	183	55	t	2026-06-01 16:27:13.19883	Pending
371	184	56	f	\N	Pending
372	184	58	f	\N	Pending
373	184	60	f	\N	Pending
376	185	53	t	2026-06-01 17:21:57.871036	Received
374	185	59	t	2026-06-01 17:21:57.870936	Received
375	185	54	t	2026-06-01 17:21:57.871003	Received
\.


--
-- Data for Name: quotation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_requests (id, tenant_id, site_id, qr_number, project_id, created_by_id, required_date, remarks, status, approved_by_id, approved_at, is_deleted, created_at, updated_at) FROM stdin;
179	3	3	QR-00012	1	4	\N	\N	Ordered	\N	\N	f	2026-04-29 18:52:30.375564	2026-05-25 18:43:27.75731
183	3	3	QR-00018	1	4	2026-05-27	\N	Requested	\N	\N	f	2026-05-20 14:07:32.990262	2026-06-01 16:27:13.202065
184	3	3	QR-00019	1	4	2026-06-05	\N	Draft	\N	\N	f	2026-06-01 16:31:47.679361	2026-06-01 16:31:47.679403
185	3	3	QR-00020	1	4	2026-06-17	\N	Ordered	4	2026-06-01 17:27:47.625711	f	2026-06-01 17:21:44.808021	2026-06-01 17:32:30.43677
175	3	3	QR-00008	1	4	\N	\N	Ordered	\N	\N	f	2026-04-25 18:52:30.375564	2026-06-01 17:37:01.194297
181	3	3	QR-00014	1	4	\N	\N	Compared	\N	\N	f	2026-05-01 18:52:30.375564	2026-06-01 18:37:36.351866
180	3	3	QR-00013	1	4	\N	\N	Compared	\N	\N	f	2026-04-30 18:52:30.375564	2026-06-01 18:37:36.554383
174	3	3	QR-00007	1	4	\N	\N	Compared	\N	\N	f	2026-04-24 18:52:30.375564	2026-06-02 13:30:24.236504
168	3	3	QR-00001	1	4	\N	\N	Received	\N	\N	f	2026-04-18 18:52:30.375564	2026-05-15 18:52:30.473134
169	3	3	QR-00002	1	4	\N	\N	Approved	\N	\N	f	2026-04-19 18:52:30.375564	2026-05-15 18:52:30.489799
170	3	3	QR-00003	1	4	\N	\N	Compared	\N	\N	f	2026-04-20 18:52:30.375564	2026-05-15 18:52:30.501487
171	3	3	QR-00004	1	4	\N	\N	Compared	\N	\N	f	2026-04-21 18:52:30.375564	2026-05-15 18:52:30.512816
172	3	3	QR-00005	1	4	\N	\N	Received	\N	\N	f	2026-04-22 18:52:30.375564	2026-05-15 18:52:30.52254
173	3	3	QR-00006	1	4	\N	\N	Approved	\N	\N	f	2026-04-23 18:52:30.375564	2026-05-15 18:52:30.531489
176	3	3	QR-00009	1	4	\N	\N	Compared	\N	\N	f	2026-04-26 18:52:30.375564	2026-05-15 18:52:30.562053
177	3	3	QR-00010	1	4	\N	\N	Approved	\N	\N	f	2026-04-27 18:52:30.375564	2026-05-15 18:52:30.571349
178	3	3	QR-00011	1	4	\N	\N	Compared	\N	\N	f	2026-04-28 18:52:30.375564	2026-05-15 18:52:30.579722
182	3	3	QR-00015	1	4	\N	\N	Compared	\N	\N	f	2026-05-02 18:52:30.375564	2026-05-15 18:52:30.613049
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, resource, can_read, can_create, can_update, can_delete, extended_actions) FROM stdin;
487	7	indents	t	f	f	f	{"can_approve": true, "can_reject": true, "can_convert_to_po": false, "can_acknowledge": false}
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
488	7	purchase_requests	t	f	f	f	{"can_submit": false, "can_approve": true, "can_reject": true, "can_convert_to_po": false, "can_hold": true, "can_short_close": true}
489	7	acknowledgements	t	t	t	t	{"can_acknowledge": true}
500	12	indents	t	t	t	t	{}
501	12	quotations	t	t	t	t	{}
502	12	invoice	t	t	t	t	{}
503	12	acknowledgements	t	t	t	t	{}
504	12	departments	t	t	t	t	{}
505	12	terms	t	t	t	t	{}
506	12	dashboard	t	t	t	t	{}
507	12	materials	t	t	t	t	{}
508	12	categories	t	t	t	t	{}
459	10	indents	t	t	t	t	{}
460	10	quotations	t	t	t	t	{}
461	10	invoice	t	t	t	t	{}
509	12	vendors	t	t	t	t	{}
510	12	organizations	t	t	t	t	{}
511	12	projects	t	t	t	t	{}
512	12	buildings	t	t	t	t	{}
462	10	acknowledgements	t	t	t	t	{}
463	10	departments	t	t	t	t	{}
464	10	terms	t	t	t	t	{}
465	11	indents	t	t	t	t	{}
466	11	quotations	t	t	t	t	{}
467	11	invoice	t	t	t	t	{}
468	11	acknowledgements	t	t	t	t	{}
469	11	departments	t	t	t	t	{}
470	11	terms	t	t	t	t	{}
513	12	warehouses	t	t	t	t	{}
514	12	purchase_requests	t	t	t	t	{}
481	9	gate_entry	t	t	t	t	{"can_record_entry": true, "can_verify": true}
515	12	purchase_orders	t	t	t	t	{}
516	12	gate_entry	t	t	t	t	{}
517	12	grn	t	t	t	t	{}
518	12	issues	t	t	t	t	{}
519	12	returns	t	t	t	t	{}
520	12	transfers	t	t	t	t	{}
521	12	inventory	t	t	t	t	{}
522	12	intelligence	t	t	t	t	{}
523	12	reports	t	t	t	t	{}
524	12	admin_users	t	t	t	t	{}
525	12	admin_roles	t	t	t	t	{}
526	12	alerts	t	t	t	t	{}
527	12	report_issue_summary	t	f	f	f	{}
528	12	report_rate_analysis	t	f	f	f	{}
529	12	report_receipt_summary	t	f	f	f	{}
530	12	report_dept_inventory	t	f	f	f	{}
368	8	dashboard	t	f	f	f	{}
369	8	quotations	f	f	f	f	{"can_approve": true}
370	8	purchase_orders	f	f	f	f	{"can_approve": true, "can_reject": true}
371	8	intelligence	t	f	f	f	{}
254	4	dashboard	t	f	f	f	{}
255	4	materials	t	t	t	t	{}
256	4	categories	t	t	t	t	{}
257	4	vendors	t	t	t	t	{}
258	4	warehouses	t	t	t	t	{}
259	4	indents	t	t	t	t	{"can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_acknowledge": true}
260	4	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": true, "can_reject": true, "can_convert_to_po": true, "can_hold": true, "can_short_close": true}
261	4	quotations	t	t	t	t	{"can_send_to_vendors": true, "can_receive": true, "can_enter_quotes": true, "can_compare": true, "can_approve": true, "can_convert_to_po": true}
262	4	purchase_orders	t	t	t	t	{"can_approve": true, "can_reject": true, "can_hold": true, "can_send_to_vendor": true, "can_short_close": true}
263	4	gate_entry	t	t	t	t	{}
264	4	invoice	t	t	t	t	{}
265	4	grn	t	t	t	t	{}
266	4	issues	t	t	t	t	{}
267	4	acknowledgements	t	t	t	t	{}
268	4	inventory	t	t	t	t	{}
269	4	intelligence	t	f	f	f	{}
270	4	reports	t	f	f	f	{}
271	4	admin_users	t	t	t	t	{}
272	4	admin_roles	t	t	t	t	{}
273	4	approval_flows	t	t	t	t	{}
274	4	projects	t	t	t	t	{}
275	4	organizations	t	t	t	t	{}
276	4	departments	t	t	t	t	{}
277	4	terms	t	t	t	t	{}
396	10	dashboard	t	t	t	t	{}
397	10	materials	t	t	t	t	{}
398	10	categories	t	t	t	t	{}
399	10	vendors	t	t	t	t	{}
400	10	organizations	t	t	t	t	{}
401	10	projects	t	t	t	t	{}
402	10	buildings	t	t	t	t	{}
403	10	warehouses	t	t	t	t	{}
404	10	purchase_requests	t	t	t	t	{}
405	10	purchase_orders	t	t	t	t	{}
406	10	gate_entry	t	t	t	t	{}
407	10	grn	t	t	t	t	{}
408	10	issues	t	t	t	t	{}
409	10	returns	t	t	t	t	{}
410	10	transfers	t	t	t	t	{}
411	10	inventory	t	t	t	t	{}
412	10	intelligence	t	t	t	t	{}
413	10	reports	t	t	t	t	{}
414	10	admin_users	t	t	t	t	{}
415	10	admin_roles	t	t	t	t	{}
416	10	alerts	t	t	t	t	{}
417	11	dashboard	t	t	t	t	{}
418	11	materials	t	t	t	t	{}
419	11	categories	t	t	t	t	{}
420	11	vendors	t	t	t	t	{}
494	5	purchase_requests	t	t	t	t	{"can_submit": true, "can_approve": false, "can_reject": false, "can_convert_to_po": false, "can_hold": false, "can_short_close": false}
495	5	grn	t	t	t	t	{"can_create_grn": true, "can_complete": true}
496	5	invoice	t	t	t	t	{"can_register": true, "can_approve": true, "can_reject": true}
497	5	issues	t	t	t	t	{"can_issue": true, "can_print": true}
498	5	report_issue_summary	t	f	f	f	{}
499	5	report_receipt_summary	t	f	f	f	{}
421	11	organizations	t	t	t	t	{}
422	11	projects	t	t	t	t	{}
423	11	buildings	t	t	t	t	{}
424	11	warehouses	t	t	t	t	{}
425	11	purchase_requests	t	t	t	t	{}
426	11	purchase_orders	t	t	t	t	{}
427	11	gate_entry	t	t	t	t	{}
428	11	grn	t	t	t	t	{}
429	11	issues	t	t	t	t	{}
430	11	returns	t	t	t	t	{}
431	11	transfers	t	t	t	t	{}
432	11	inventory	t	t	t	t	{}
433	11	intelligence	t	t	t	t	{}
434	11	reports	t	t	t	t	{}
435	11	admin_users	t	t	t	t	{}
436	11	admin_roles	t	t	t	t	{}
437	11	alerts	t	t	t	t	{}
479	6	indents	t	t	t	t	{"can_acknowledge": false, "can_approve": false, "can_reject": false, "can_convert_to_po": false}
480	6	acknowledgements	t	t	t	t	{"can_acknowledge": true}
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, tenant_id, name, code, description, is_system, created_at, data_access_scope) FROM stdin;
7	3	Department Head	DEPARTMENTHEAD	Look after their department	f	2026-05-27 15:36:15.454248	Department
3	3	Store Admin	STOREADMIN	Full tenant access	f	2026-05-15 12:07:06.801413	Organization
8	3	CEO	CEO	Chief Executive Officer	f	2026-05-27 15:36:36.10235	Organization
9	3	Gate Keeper	GATEKEEPER	Incharge of material IN/OUT	f	2026-05-27 15:42:33.453327	Organization
5	3	Store keeper	STOREKEEPER	the person takes care of material in store	f	2026-05-27 15:34:40.519209	Organization
4	3	Store Manager	STOREMANAGER	The person responsible for all the store management	f	2026-05-27 15:28:37.187928	Organization
6	3	Indenter	INDENTER	the person request for the materials required	f	2026-05-27 15:35:43.041222	Department
10	1	Admin	admin	Full tenant access	f	2026-06-01 19:19:41.504549	Full Administrative Access
11	2	Admin	admin	Full tenant access	f	2026-06-01 19:19:41.536244	Full Administrative Access
12	3	Admin	ADMIN	Full tenant access	f	2026-06-01 19:19:41.545765	Full Administrative Access
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, tenant_id, site_id, name, code, department_name, floor_id, is_active, is_deleted, created_at) FROM stdin;
2	3	3	Room1	RM-00002	CIVIL	2	t	f	2026-05-15 13:20:49.544108
1	3	3	Room1	RM-00001	CIVIL	1	t	f	2026-05-15 12:40:07.999107
3	3	3	Room31	RM-00003	ADMIN	3	t	f	2026-06-01 14:51:03.544205
4	3	3	Room 002	RM-BLDG-00001-0-2	CVS	1	t	f	2026-06-03 13:09:42.532978
5	3	3	Room 003	RM-BLDG-00001-0-3	DEPT OF OPTHALMOLOGY	1	t	f	2026-06-03 13:09:42.532993
6	3	3	Room 004	RM-BLDG-00001-0-4	BIO-MEDICAL	1	t	f	2026-06-03 13:09:42.532997
7	3	3	Room 005	RM-BLDG-00001-0-5	DIALYSIS	1	t	f	2026-06-03 13:09:42.533001
8	3	3	Room 006	RM-BLDG-00001-0-6	HOSPITAL SUPERVISOR	1	t	f	2026-06-03 13:09:42.533005
9	3	3	Room 007	RM-BLDG-00001-0-7	BIOCHEMISTRY MEDICAL COLLEGE	1	t	f	2026-06-03 13:09:42.533008
10	3	3	Room 008	RM-BLDG-00001-0-8	EQUIPMENT -DEPT	1	t	f	2026-06-03 13:09:42.533011
11	3	3	Room 009	RM-BLDG-00001-0-9	EMERGENCY YELLOW ZONE	1	t	f	2026-06-03 13:09:42.533014
12	3	3	Room 010	RM-BLDG-00001-0-10	LAUNDRY	1	t	f	2026-06-03 13:09:42.533017
13	3	3	Room 011	RM-BLDG-00001-0-11	INFECTION CONTROL DEPARTMENT	1	t	f	2026-06-03 13:09:42.53302
14	3	3	Room 012	RM-BLDG-00001-0-12	CAMP,	1	t	f	2026-06-03 13:09:42.533023
15	3	3	Room 013	RM-BLDG-00001-0-13	INSTITUTIONAL ETHICS DEPARTMENT	1	t	f	2026-06-03 13:09:42.533026
16	3	3	Room 014	RM-BLDG-00001-0-14	INSTITUTIONAL ETHICS DEPARTMENT	1	t	f	2026-06-03 13:09:42.533029
17	3	3	Room 015	RM-BLDG-00001-0-15	ANATOMY	1	t	f	2026-06-03 13:09:42.533032
18	3	3	Room 101	RM-BLDG-00001-1-1	MARKETING DEPARTMENT	4	t	f	2026-06-03 13:09:42.546231
19	3	3	Room 102	RM-BLDG-00001-1-2	2DECHO AND TMT ROOM	4	t	f	2026-06-03 13:09:42.547454
20	3	3	Room 103	RM-BLDG-00001-1-3	IT DEPARTMENT	4	t	f	2026-06-03 13:09:42.548692
21	3	3	Room 104	RM-BLDG-00001-1-4	MAINTENANCE	4	t	f	2026-06-03 13:09:42.550111
22	3	3	Room 105	RM-BLDG-00001-1-5	MARKETING DEPARTMENT	4	t	f	2026-06-03 13:09:42.550123
23	3	3	Room 106	RM-BLDG-00001-1-6	MRD	4	t	f	2026-06-03 13:09:42.551587
24	3	3	Room 107	RM-BLDG-00001-1-7	PURCHASE	4	t	f	2026-06-03 13:09:42.552676
25	3	3	Room 108	RM-BLDG-00001-1-8	INTERNAL AUDIT DEPARTMENT	4	t	f	2026-06-03 13:09:42.55374
26	3	3	Room 109	RM-BLDG-00001-1-9	COMMUNITY CENTRE - SHAKTHI	4	t	f	2026-06-03 13:09:42.554882
27	3	3	Room 110	RM-BLDG-00001-1-10	MORTUARY	4	t	f	2026-06-03 13:09:42.55601
28	3	3	Room 111	RM-BLDG-00001-1-11	INFECTION CONTROL DEPARTMENT	4	t	f	2026-06-03 13:09:42.556997
29	3	3	Room 112	RM-BLDG-00001-1-12	ENGINEERING COLLEGE DEPARTMENT	4	t	f	2026-06-03 13:09:42.558042
30	3	3	Room 113	RM-BLDG-00001-1-13	INSURANCE DEPARTMENT	4	t	f	2026-06-03 13:09:42.559142
31	3	3	Room 114	RM-BLDG-00001-1-14	DENTAL PROSTHODONTICS	4	t	f	2026-06-03 13:09:42.560111
32	3	3	Room 202	RM-BLDG-00001-2-2	DEPT OF CSSD	2	t	f	2026-06-03 13:09:42.569998
33	3	3	Room 203	RM-BLDG-00001-2-3	DENTAL PEDODONTICS	2	t	f	2026-06-03 13:09:42.571203
34	3	3	Room 204	RM-BLDG-00001-2-4	DEPT OF ORTHOPAEDIC	2	t	f	2026-06-03 13:09:42.572775
35	3	3	Room 205	RM-BLDG-00001-2-5	BIO CHEMISTRY	2	t	f	2026-06-03 13:09:42.573915
36	3	3	Room 206	RM-BLDG-00001-2-6	EQUIPMENT -DEPT	2	t	f	2026-06-03 13:09:42.574975
37	3	3	Room 207	RM-BLDG-00001-2-7	CHINNAPPA CANTEEN	2	t	f	2026-06-03 13:09:42.57599
38	3	3	Room 208	RM-BLDG-00001-2-8	MEDICAL COLLEGE HSK SUPERVISOR	2	t	f	2026-06-03 13:09:42.576954
39	3	3	Room 209	RM-BLDG-00001-2-9	COMMUNITY CENTRE - SHAKTHI	2	t	f	2026-06-03 13:09:42.577914
40	3	3	Room 210	RM-BLDG-00001-2-10	CLINICAL PHARMACOLOGY	2	t	f	2026-06-03 13:09:42.57888
41	3	3	Room 332	RM-BLDG-00001-3-32	ADMIN	3	t	f	2026-06-03 13:09:42.586379
42	3	3	Room 333	RM-BLDG-00001-3-33	MEDICAL EDUCATION UNIT - AJIMS	3	t	f	2026-06-03 13:09:42.587435
43	3	3	Room 334	RM-BLDG-00001-3-34	COMMUNITY CENTRE - PANE MANGAL	3	t	f	2026-06-03 13:09:42.588736
44	3	3	Room 335	RM-BLDG-00001-3-35	CIVIL DEPARTMENT	3	t	f	2026-06-03 13:09:42.590027
45	3	3	Room 336	RM-BLDG-00001-3-36	BILLING SECTION	3	t	f	2026-06-03 13:09:42.591102
46	3	3	Room 337	RM-BLDG-00001-3-37	HOSPITAL SUPERVISOR	3	t	f	2026-06-03 13:09:42.592144
47	3	3	Room 338	RM-BLDG-00001-3-38	DENTAL PROSTHODONTICS	3	t	f	2026-06-03 13:09:42.593166
48	3	3	Room 339	RM-BLDG-00001-3-39	INFECTION CONTROL DEPARTMENT	3	t	f	2026-06-03 13:09:42.594085
49	3	3	Room 340	RM-BLDG-00001-3-40	COMPUTER DEPARTMENT	3	t	f	2026-06-03 13:09:42.59502
50	3	3	Room 341	RM-BLDG-00001-3-41	CHINNAPPA CANTEEN	3	t	f	2026-06-03 13:09:42.595974
51	3	3	Room 342	RM-BLDG-00001-3-42	EQUIPMENT -DEPT	3	t	f	2026-06-03 13:09:42.597007
52	3	3	Room 343	RM-BLDG-00001-3-43	CLINICAL PHARMACOLOGY	3	t	f	2026-06-03 13:09:42.598042
53	3	3	Room 401	RM-BLDG-00001-4-1	DENTAL-LIBRARY	5	t	f	2026-06-03 13:09:42.611776
54	3	3	Room 402	RM-BLDG-00001-4-2	BLOOD BANK	5	t	f	2026-06-03 13:09:42.612962
55	3	3	Room 403	RM-BLDG-00001-4-3	DIALYSIS	5	t	f	2026-06-03 13:09:42.614098
56	3	3	Room 404	RM-BLDG-00001-4-4	COMMUNITY CENTER PERAR	5	t	f	2026-06-03 13:09:42.61545
57	3	3	Room 405	RM-BLDG-00001-4-5	CARDIO THORACIC UNIT	5	t	f	2026-06-03 13:09:42.617034
58	3	3	Room 406	RM-BLDG-00001-4-6	CORPORATE	5	t	f	2026-06-03 13:09:42.618472
59	3	3	Room 407	RM-BLDG-00001-4-7	ENGINEERING COLLEGE DEPARTMENT	5	t	f	2026-06-03 13:09:42.620016
60	3	3	Room 408	RM-BLDG-00001-4-8	EXAMINATION HALL,	5	t	f	2026-06-03 13:09:42.621384
61	3	3	Room 409	RM-BLDG-00001-4-9	DENTAL ORAL MEDICINE & RADIOLOGY	5	t	f	2026-06-03 13:09:42.622965
62	3	3	Room 410	RM-BLDG-00001-4-10	CASUALTY	5	t	f	2026-06-03 13:09:42.624314
63	3	3	Room 411	RM-BLDG-00001-4-11	COMMUNITY MEDICINE	5	t	f	2026-06-03 13:09:42.62544
64	3	3	Room 412	RM-BLDG-00001-4-12	EMERGENCY GREEN ZONE	5	t	f	2026-06-03 13:09:42.626672
65	3	3	Room 413	RM-BLDG-00001-4-13	CARDIO THORACIC 0.T	5	t	f	2026-06-03 13:09:42.627662
66	3	3	Room 501	RM-BLDG-00001-5-1	DRUG INFORMATION CENTRE	14	t	f	2026-06-03 13:09:42.636717
67	3	3	Room 502	RM-BLDG-00001-5-2	COMMUNITY CENTRE - SHAKTHI	14	t	f	2026-06-03 13:09:42.637932
68	3	3	Room 503	RM-BLDG-00001-5-3	ENDOSCOPY	14	t	f	2026-06-03 13:09:42.639377
69	3	3	Room 504	RM-BLDG-00001-5-4	CAMP,	14	t	f	2026-06-03 13:09:42.640627
70	3	3	Room 505	RM-BLDG-00001-5-5	COU	14	t	f	2026-06-03 13:09:42.641773
71	3	3	Room 506	RM-BLDG-00001-5-6	MARKETING DEPARTMENT	14	t	f	2026-06-03 13:09:42.642876
72	3	3	Room 507	RM-BLDG-00001-5-7	ALLIED HEALTH SCIENCE	14	t	f	2026-06-03 13:09:42.64402
73	3	3	Room 508	RM-BLDG-00001-5-8	ITU	14	t	f	2026-06-03 13:09:42.64512
74	3	3	Room 509	RM-BLDG-00001-5-9	CLINICAL DEPARTMENT	14	t	f	2026-06-03 13:09:42.646247
75	3	3	Room 510	RM-BLDG-00001-5-10	CORPORATE	14	t	f	2026-06-03 13:09:42.647311
76	3	3	Room 001	RM-BLDG-00002-0-1	PICU	6	t	f	2026-06-03 13:09:42.671789
77	3	3	Room 002	RM-BLDG-00002-0-2	REGISTRATION	6	t	f	2026-06-03 13:09:42.671805
78	3	3	Room 003	RM-BLDG-00002-0-3	NURSING SUPERINTENDENT	6	t	f	2026-06-03 13:09:42.671809
79	3	3	Room 004	RM-BLDG-00002-0-4	PATHOLOGY	6	t	f	2026-06-03 13:09:42.671814
80	3	3	Room 005	RM-BLDG-00002-0-5	UHTC	6	t	f	2026-06-03 13:09:42.671817
81	3	3	Room 006	RM-BLDG-00002-0-6	MEDICAL DIRECTOR	6	t	f	2026-06-03 13:09:42.671821
82	3	3	Room 007	RM-BLDG-00002-0-7	POST OPERATIVE	6	t	f	2026-06-03 13:09:42.671824
83	3	3	Room 008	RM-BLDG-00002-0-8	TRUST OFFICE	6	t	f	2026-06-03 13:09:42.671828
84	3	3	Room 009	RM-BLDG-00002-0-9	PACKAGE - ASD CLOSURE	6	t	f	2026-06-03 13:09:42.671831
85	3	3	Room 010	RM-BLDG-00002-0-10	MEDICAL DIRECTOR	6	t	f	2026-06-03 13:09:42.671835
86	3	3	Room 011	RM-BLDG-00002-0-11	CATH LABORATORY	6	t	f	2026-06-03 13:09:42.671839
87	3	3	Room 012	RM-BLDG-00002-0-12	PURCHASE DEPARTMENT	6	t	f	2026-06-03 13:09:42.671842
88	3	3	Room 013	RM-BLDG-00002-0-13	CATH LAB	6	t	f	2026-06-03 13:09:42.671846
89	3	3	Room 101	RM-BLDG-00002-1-1	MS OFFICE AJIMS	7	t	f	2026-06-03 13:09:42.687502
90	3	3	Room 102	RM-BLDG-00002-1-2	PHARMACY COLLEGE	7	t	f	2026-06-03 13:09:42.688953
91	3	3	Room 103	RM-BLDG-00002-1-3	LABOUR ROOM	7	t	f	2026-06-03 13:09:42.690454
92	3	3	Room 104	RM-BLDG-00002-1-4	TRUST OFFICE	7	t	f	2026-06-03 13:09:42.691693
93	3	3	Room 105	RM-BLDG-00002-1-5	SECURITY DEPT	7	t	f	2026-06-03 13:09:42.693051
94	3	3	Room 106	RM-BLDG-00002-1-6	TRUST OFFICE	7	t	f	2026-06-03 13:09:42.693062
95	3	3	Room 107	RM-BLDG-00002-1-7	MICROBIOLOGY MEDICAL COLLEGE	7	t	f	2026-06-03 13:09:42.694539
96	3	3	Room 108	RM-BLDG-00002-1-8	PHARMACOLOGY CLINICAL TRIAL UNIT	7	t	f	2026-06-03 13:09:42.695735
97	3	3	Room 109	RM-BLDG-00002-1-9	PHARMACY MAIN STORE	7	t	f	2026-06-03 13:09:42.696895
98	3	3	Room 110	RM-BLDG-00002-1-10	CATH LAB TECHNICIAN	7	t	f	2026-06-03 13:09:42.698137
99	3	3	Room 111	RM-BLDG-00002-1-11	RADIOLOGY	7	t	f	2026-06-03 13:09:42.699401
100	3	3	Room 201	RM-BLDG-00002-2-1	PSYCHIATRY OPD	8	t	f	2026-06-03 13:09:42.721045
101	3	3	Room 202	RM-BLDG-00002-2-2	NABH	8	t	f	2026-06-03 13:09:42.722654
102	3	3	Room 203	RM-BLDG-00002-2-3	NICU	8	t	f	2026-06-03 13:09:42.724239
103	3	3	Room 204	RM-BLDG-00002-2-4	MEDICINE OPD	8	t	f	2026-06-03 13:09:42.725495
104	3	3	Room 205	RM-BLDG-00002-2-5	PRINCIPLE OFFICE MEDICAL COLLEGE	8	t	f	2026-06-03 13:09:42.726688
105	3	3	Room 206	RM-BLDG-00002-2-6	PHARMACY COLLEGE	8	t	f	2026-06-03 13:09:42.727918
106	3	3	Room 207	RM-BLDG-00002-2-7	CATH LAB TECHNICIAN	8	t	f	2026-06-03 13:09:42.729147
107	3	3	Room 208	RM-BLDG-00002-2-8	MINOR OT	8	t	f	2026-06-03 13:09:42.730325
108	3	3	Room 209	RM-BLDG-00002-2-9	TRUST OFFICE	8	t	f	2026-06-03 13:09:42.731568
109	3	3	Room 210	RM-BLDG-00002-2-10	SEROLOGY	8	t	f	2026-06-03 13:09:42.732844
110	3	3	Room 301	RM-BLDG-00002-3-1	SPORTS DEPARTMENT	15	t	f	2026-06-03 13:09:42.761886
111	3	3	Room 302	RM-BLDG-00002-3-2	PARAMEDICAL	15	t	f	2026-06-03 13:09:42.76377
112	3	3	Room 303	RM-BLDG-00002-3-3	PHARMACY COLLEGE	15	t	f	2026-06-03 13:09:42.765753
113	3	3	Room 304	RM-BLDG-00002-3-4	PATHOLOGY	15	t	f	2026-06-03 13:09:42.768214
114	3	3	Room 305	RM-BLDG-00002-3-5	PICU	15	t	f	2026-06-03 13:09:42.770455
115	3	3	Room 306	RM-BLDG-00002-3-6	PHYSIOLOGY	15	t	f	2026-06-03 13:09:42.772652
116	3	3	Room 307	RM-BLDG-00002-3-7	CARDIOLOGY OPD	15	t	f	2026-06-03 13:09:42.774911
117	3	3	Room 308	RM-BLDG-00002-3-8	OBG OPD	15	t	f	2026-06-03 13:09:42.777276
118	3	3	Room 309	RM-BLDG-00002-3-9	OBG OPD	15	t	f	2026-06-03 13:09:42.777295
119	3	3	Room 310	RM-BLDG-00002-3-10	SEROLOGY	15	t	f	2026-06-03 13:09:42.779686
120	3	3	Room 311	RM-BLDG-00002-3-11	PURCHASE DEPARTMENT	15	t	f	2026-06-03 13:09:42.781602
121	3	3	Room 312	RM-BLDG-00002-3-12	MAJOR OT	15	t	f	2026-06-03 13:09:42.783715
122	3	3	Room 313	RM-BLDG-00002-3-13	REGISTRATION	15	t	f	2026-06-03 13:09:42.785861
123	3	3	Room 314	RM-BLDG-00002-3-14	NURSING SUPERINTENDENT	15	t	f	2026-06-03 13:09:42.787863
124	3	3	Room 315	RM-BLDG-00002-3-15	PUC DEPARTMENT	15	t	f	2026-06-03 13:09:42.789793
125	3	3	Room 401	RM-BLDG-00002-4-1	PATHOLOGY	16	t	f	2026-06-03 13:09:42.804663
126	3	3	Room 402	RM-BLDG-00002-4-2	OPD	16	t	f	2026-06-03 13:09:42.80683
127	3	3	Room 403	RM-BLDG-00002-4-3	PICU	16	t	f	2026-06-03 13:09:42.808742
128	3	3	Room 404	RM-BLDG-00002-4-4	NESCAFE	16	t	f	2026-06-03 13:09:42.81068
129	3	3	Room 405	RM-BLDG-00002-4-5	ENT OPD	16	t	f	2026-06-03 13:09:42.812549
130	3	3	Room 406	RM-BLDG-00002-4-6	MICROBIOLOGY	16	t	f	2026-06-03 13:09:42.814438
131	3	3	Room 407	RM-BLDG-00002-4-7	NEUROLOGY OPD	16	t	f	2026-06-03 13:09:42.816735
132	3	3	Room 408	RM-BLDG-00002-4-8	ENT OPD	16	t	f	2026-06-03 13:09:42.816755
133	3	3	Room 409	RM-BLDG-00002-4-9	MATRON OFFICE	16	t	f	2026-06-03 13:09:42.819565
134	3	3	Room 410	RM-BLDG-00002-4-10	NURSING SUPERINTENDENT	16	t	f	2026-06-03 13:09:42.821719
135	3	3	Room 411	RM-BLDG-00002-4-11	LABOUR ROOM	16	t	f	2026-06-03 13:09:42.824102
136	3	3	Room 412	RM-BLDG-00002-4-12	OT-ORTHO	16	t	f	2026-06-03 13:09:42.82624
137	3	3	Room 413	RM-BLDG-00002-4-13	PHYSICAL EDUCATIONAL DIRECTOR	16	t	f	2026-06-03 13:09:42.828413
138	3	3	Room 414	RM-BLDG-00002-4-14	NEPHROLOGY OPD	16	t	f	2026-06-03 13:09:42.830343
139	3	3	Room 415	RM-BLDG-00002-4-15	PCR LAB	16	t	f	2026-06-03 13:09:42.832116
140	3	3	Room 501	RM-BLDG-00002-5-1	OPD Medical College	17	t	f	2026-06-03 13:09:42.846369
141	3	3	Room 502	RM-BLDG-00002-5-2	TRANSPORT DEPARTMENT	17	t	f	2026-06-03 13:09:42.848353
142	3	3	Room 503	RM-BLDG-00002-5-3	LAB COMMUNITY CENTRE - PANEMAN	17	t	f	2026-06-03 13:09:42.850401
143	3	3	Room 504	RM-BLDG-00002-5-4	MS OFFICE AJIMS	17	t	f	2026-06-03 13:09:42.852681
144	3	3	Room 505	RM-BLDG-00002-5-5	OT-NEURO	17	t	f	2026-06-03 13:09:42.854655
145	3	3	Room 506	RM-BLDG-00002-5-6	Dental OPD	17	t	f	2026-06-03 13:09:42.856717
146	3	3	Room 507	RM-BLDG-00002-5-7	FRONT OFFICE	17	t	f	2026-06-03 13:09:42.858744
147	3	3	Room 508	RM-BLDG-00002-5-8	UROLOGY OPD	17	t	f	2026-06-03 13:09:42.860835
148	3	3	Room 509	RM-BLDG-00002-5-9	MS OFFICE AJIMS	17	t	f	2026-06-03 13:09:42.860852
149	3	3	Room 510	RM-BLDG-00002-5-10	POW&SPW	17	t	f	2026-06-03 13:09:42.863122
150	3	3	Room 511	RM-BLDG-00002-5-11	CARDIOLOGY OPD	17	t	f	2026-06-03 13:09:42.865024
151	3	3	Room 512	RM-BLDG-00002-5-12	PHYSIOTHERAPY COLLEGE	17	t	f	2026-06-03 13:09:42.867285
152	3	3	Room 513	RM-BLDG-00002-5-13	MATRON OFFICE	17	t	f	2026-06-03 13:09:42.869429
153	3	3	Room 101	RM-BLDG-00003-1-1	214 WARD	9	t	f	2026-06-03 13:09:42.896793
154	3	3	Room 102	RM-BLDG-00003-1-2	106 WARD	9	t	f	2026-06-03 13:09:42.896813
155	3	3	Room 103	RM-BLDG-00003-1-3	SPECIAL WARD	9	t	f	2026-06-03 13:09:42.896821
156	3	3	Room 104	RM-BLDG-00003-1-4	PAEDIATRIC WARD	9	t	f	2026-06-03 13:09:42.896827
157	3	3	Room 105	RM-BLDG-00003-1-5	SPECIAL WARD	9	t	f	2026-06-03 13:09:42.896833
158	3	3	Room 106	RM-BLDG-00003-1-6	MALE ORTHO WARD 109	9	t	f	2026-06-03 13:09:42.896838
159	3	3	Room 107	RM-BLDG-00003-1-7	214 WARD	9	t	f	2026-06-03 13:09:42.896844
160	3	3	Room 108	RM-BLDG-00003-1-8	401 WARD	9	t	f	2026-06-03 13:09:42.89685
161	3	3	Room 109	RM-BLDG-00003-1-9	209 WARD	9	t	f	2026-06-03 13:09:42.896855
162	3	3	Room 110	RM-BLDG-00003-1-10	208 WARD	9	t	f	2026-06-03 13:09:42.896861
163	3	3	Room 111	RM-BLDG-00003-1-11	203 WARD	9	t	f	2026-06-03 13:09:42.896866
164	3	3	Room 112	RM-BLDG-00003-1-12	OPTHALMOLOGY WARD	9	t	f	2026-06-03 13:09:42.896872
165	3	3	Room 201	RM-BLDG-00003-2-1	202 WARD	18	t	f	2026-06-03 13:09:42.912914
166	3	3	Room 202	RM-BLDG-00003-2-2	107 WARD	18	t	f	2026-06-03 13:09:42.91486
167	3	3	Room 203	RM-BLDG-00003-2-3	112 WARD	18	t	f	2026-06-03 13:09:42.917109
168	3	3	Room 204	RM-BLDG-00003-2-4	111 WARD	18	t	f	2026-06-03 13:09:42.919532
169	3	3	Room 205	RM-BLDG-00003-2-5	COVID-19 WARD	18	t	f	2026-06-03 13:09:42.921786
170	3	3	Room 206	RM-BLDG-00003-2-6	102 WARD	18	t	f	2026-06-03 13:09:42.924158
171	3	3	Room 207	RM-BLDG-00003-2-7	SRD FLOOR SPECIAL WARD	18	t	f	2026-06-03 13:09:42.926518
172	3	3	Room 208	RM-BLDG-00003-2-8	102 WARD	18	t	f	2026-06-03 13:09:42.926539
173	3	3	Room 209	RM-BLDG-00003-2-9	CASUALITY OBSERVATION WARD	18	t	f	2026-06-03 13:09:42.929106
174	3	3	Room 210	RM-BLDG-00003-2-10	SPECIAL WARD	18	t	f	2026-06-03 13:09:42.930977
175	3	3	Room 211	RM-BLDG-00003-2-11	MALE SURGERY WARD-210	18	t	f	2026-06-03 13:09:42.932909
176	3	3	Room 212	RM-BLDG-00003-2-12	205 WARD	18	t	f	2026-06-03 13:09:42.935091
177	3	3	Room 213	RM-BLDG-00003-2-13	OPTHALMOLOGY WARD	18	t	f	2026-06-03 13:09:42.93716
178	3	3	Room 214	RM-BLDG-00003-2-14	216 WARD	18	t	f	2026-06-03 13:09:42.938982
179	3	3	Room 301	RM-BLDG-00003-3-1	FEMALE SURGERY WARD-108	19	t	f	2026-06-03 13:09:42.963249
180	3	3	Room 302	RM-BLDG-00003-3-2	213 WARD	19	t	f	2026-06-03 13:09:42.968098
181	3	3	Room 303	RM-BLDG-00003-3-3	210 WARD	19	t	f	2026-06-03 13:09:42.973178
182	3	3	Room 304	RM-BLDG-00003-3-4	202 WARD	19	t	f	2026-06-03 13:09:42.976831
183	3	3	Room 305	RM-BLDG-00003-3-5	SRD FLOOR SPECIAL WARD	19	t	f	2026-06-03 13:09:42.979872
184	3	3	Room 306	RM-BLDG-00003-3-6	CARDIAC WARD 217	19	t	f	2026-06-03 13:09:42.98272
185	3	3	Room 307	RM-BLDG-00003-3-7	204 WARD	19	t	f	2026-06-03 13:09:42.985154
186	3	3	Room 308	RM-BLDG-00003-3-8	401 WARD	19	t	f	2026-06-03 13:09:42.987264
187	3	3	Room 309	RM-BLDG-00003-3-9	OBG WARD	19	t	f	2026-06-03 13:09:42.988961
188	3	3	Room 310	RM-BLDG-00003-3-10	112 WARD	19	t	f	2026-06-03 13:09:42.990978
189	3	3	Room 311	RM-BLDG-00003-3-11	OPTHALMOLOGY WARD	19	t	f	2026-06-03 13:09:42.992686
190	3	3	Room 312	RM-BLDG-00003-3-12	PSYCHIATRY WARD 214 & 215	19	t	f	2026-06-03 13:09:42.994242
191	3	3	Room 313	RM-BLDG-00003-3-13	FEMALE SURGERY WARD-108	19	t	f	2026-06-03 13:09:42.994254
192	3	3	Room 314	RM-BLDG-00003-3-14	106 WARD	19	t	f	2026-06-03 13:09:42.996012
193	3	3	Room 315	RM-BLDG-00003-3-15	ASHRAMA WARD 2 ND FLOOR	19	t	f	2026-06-03 13:09:42.997326
194	3	3	Room 401	RM-BLDG-00003-4-1	OBSERVATION WARD -17	20	t	f	2026-06-03 13:09:43.010251
195	3	3	Room 402	RM-BLDG-00003-4-2	MALE ORTHO WARD 109	20	t	f	2026-06-03 13:09:43.0114
196	3	3	Room 403	RM-BLDG-00003-4-3	OBSERVATION WARD -18	20	t	f	2026-06-03 13:09:43.012412
197	3	3	Room 404	RM-BLDG-00003-4-4	PSYCHIATRY WARD 214 & 215	20	t	f	2026-06-03 13:09:43.013457
198	3	3	Room 405	RM-BLDG-00003-4-5	203 WARD	20	t	f	2026-06-03 13:09:43.014482
199	3	3	Room 406	RM-BLDG-00003-4-6	SPECIAL WARD	20	t	f	2026-06-03 13:09:43.01557
200	3	3	Room 407	RM-BLDG-00003-4-7	401 WARD	20	t	f	2026-06-03 13:09:43.016945
201	3	3	Room 408	RM-BLDG-00003-4-8	CARDIAC WARD 217	20	t	f	2026-06-03 13:09:43.018711
202	3	3	Room 409	RM-BLDG-00003-4-9	401 WARD	20	t	f	2026-06-03 13:09:43.018723
203	3	3	Room 410	RM-BLDG-00003-4-10	402 WARD	20	t	f	2026-06-03 13:09:43.020289
204	3	3	Room 411	RM-BLDG-00003-4-11	OPTHALMOLOGY WARD	20	t	f	2026-06-03 13:09:43.021488
205	3	3	Room 412	RM-BLDG-00003-4-12	201 WARD	20	t	f	2026-06-03 13:09:43.0227
206	3	3	Room 413	RM-BLDG-00003-4-13	401 WARD	20	t	f	2026-06-03 13:09:43.022711
207	3	3	Room 414	RM-BLDG-00003-4-14	COVID-19 WARD	20	t	f	2026-06-03 13:09:43.024243
208	3	3	Room 501	RM-BLDG-00003-5-1	110 WARD	21	t	f	2026-06-03 13:09:43.035503
209	3	3	Room 502	RM-BLDG-00003-5-2	214 WARD	21	t	f	2026-06-03 13:09:43.036721
210	3	3	Room 503	RM-BLDG-00003-5-3	110 WARD	21	t	f	2026-06-03 13:09:43.03673
211	3	3	Room 504	RM-BLDG-00003-5-4	PAEDIATRIC WARD	21	t	f	2026-06-03 13:09:43.037967
212	3	3	Room 505	RM-BLDG-00003-5-5	SPECIAL WARD 1ST. FLOOR	21	t	f	2026-06-03 13:09:43.03903
213	3	3	Room 506	RM-BLDG-00003-5-6	SRD FLOOR SPECIAL WARD	21	t	f	2026-06-03 13:09:43.040344
214	3	3	Room 507	RM-BLDG-00003-5-7	COVID-19 WARD	21	t	f	2026-06-03 13:09:43.041589
215	3	3	Room 508	RM-BLDG-00003-5-8	208 WARD	21	t	f	2026-06-03 13:09:43.042683
216	3	3	Room 509	RM-BLDG-00003-5-9	112 WARD	21	t	f	2026-06-03 13:09:43.043727
217	3	3	Room 510	RM-BLDG-00003-5-10	MALE ORTHO WARD 109	21	t	f	2026-06-03 13:09:43.044748
218	3	3	Room 511	RM-BLDG-00003-5-11	108 WARD	21	t	f	2026-06-03 13:09:43.045717
219	3	3	Room 512	RM-BLDG-00003-5-12	SPECIAL WARD	21	t	f	2026-06-03 13:09:43.046765
220	3	3	Room 513	RM-BLDG-00003-5-13	WARD SECRATORY	21	t	f	2026-06-03 13:09:43.04777
221	3	3	Room 514	RM-BLDG-00003-5-14	104 WARD	21	t	f	2026-06-03 13:09:43.048821
222	3	3	Room 515	RM-BLDG-00003-5-15	FEMALE MEDICINE WARD-110	21	t	f	2026-06-03 13:09:43.049887
223	3	3	Room 601	RM-BLDG-00003-6-1	103 WARD	22	t	f	2026-06-03 13:09:43.060231
224	3	3	Room 602	RM-BLDG-00003-6-2	MALE SURGERY WARD-210	22	t	f	2026-06-03 13:09:43.061361
225	3	3	Room 603	RM-BLDG-00003-6-3	104 WARD	22	t	f	2026-06-03 13:09:43.062349
226	3	3	Room 604	RM-BLDG-00003-6-4	203 WARD	22	t	f	2026-06-03 13:09:43.063402
227	3	3	Room 605	RM-BLDG-00003-6-5	FEMALE SURGERY WARD-108	22	t	f	2026-06-03 13:09:43.064419
228	3	3	Room 606	RM-BLDG-00003-6-6	SPECIAL WARD 1ST. FLOOR	22	t	f	2026-06-03 13:09:43.065395
229	3	3	Room 607	RM-BLDG-00003-6-7	OBG WARD	22	t	f	2026-06-03 13:09:43.066733
230	3	3	Room 608	RM-BLDG-00003-6-8	405 WARD	22	t	f	2026-06-03 13:09:43.068438
231	3	3	Room 609	RM-BLDG-00003-6-9	WARD SECRATORY	22	t	f	2026-06-03 13:09:43.069813
232	3	3	Room 610	RM-BLDG-00003-6-10	215 WARD	22	t	f	2026-06-03 13:09:43.070901
233	3	3	Room 611	RM-BLDG-00003-6-11	208 WARD	22	t	f	2026-06-03 13:09:43.072138
234	3	3	Room 612	RM-BLDG-00003-6-12	108 WARD	22	t	f	2026-06-03 13:09:43.073259
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
883	3	3	234	54	Issue	-50	3990	Issue	211	ISS-00026	1	3	\N	4	2026-06-01 14:57:06.652182
1601	3	3	965	46	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.857328
1602	3	3	966	46	Adjustment	100	100	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.860795
1603	3	3	967	46	Adjustment	283	283	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.863369
1604	3	3	968	46	Adjustment	153	153	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.866112
884	3	3	244	55	Issue	-4	47	Issue	212	ISS-00027	1	3	\N	4	2026-06-01 14:57:06.728971
885	3	3	246	48	GRN	93	192	GRN	182	GRN-00017	1	\N	\N	4	2026-06-02 18:01:24.107949
886	3	3	232	48	GRN	54	172	GRN	182	GRN-00017	1	\N	\N	4	2026-06-02 18:01:24.107966
887	3	3	224	59	GRN	100	100	GRN	183	GRN-00018	1	\N	\N	4	2026-06-02 18:01:36.988217
871	3	3	244	56	Return	2	2	Return	6	RET-00001	1	\N	\N	4	2026-05-20 12:47:03.3244
872	3	3	244	56	Outward Repair	-2	0	GatePass	1	GP-00001	1	\N	\N	4	2026-05-20 12:47:03.329841
1605	3	3	969	46	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.868441
1606	3	3	970	46	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.870969
1607	3	3	971	46	Adjustment	125	125	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.873214
1608	3	3	972	46	Adjustment	393	393	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.875135
1609	3	3	973	46	Adjustment	110	110	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.877386
1610	3	3	974	46	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.879412
1611	3	3	975	46	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.881555
1612	3	3	976	46	Adjustment	24	24	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.883558
1613	3	3	977	46	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.885566
1614	3	3	978	46	Adjustment	70	70	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.8878
1615	3	3	979	46	Adjustment	425	425	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.88982
1616	3	3	980	46	Adjustment	486	486	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.891736
1617	3	3	981	46	Adjustment	87	87	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.893747
1618	3	3	982	46	Adjustment	113	113	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.895697
1619	3	3	983	46	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.897667
1620	3	3	984	46	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.899675
1621	3	3	985	46	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.901573
1622	3	3	986	46	Adjustment	52	52	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.903726
1623	3	3	987	46	Adjustment	95	95	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.905777
1624	3	3	988	46	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.907707
1625	3	3	989	46	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.909629
1626	3	3	990	46	Adjustment	308	308	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.911721
1627	3	3	991	46	Adjustment	480	480	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.913823
1628	3	3	992	46	Adjustment	182	182	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.91611
1629	3	3	993	46	Adjustment	103	103	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.918076
878	3	3	230	61	Return	1	1	Return	15	RET-00006	1	\N	\N	4	2026-05-20 12:59:53.321192
880	3	3	238	46	Issue	-21	46	Issue	208	ISS-00023	1	2	\N	4	2026-05-26 18:18:05.529931
888	3	3	222	59	Return	2	80	Return	16	RET-00007	1	\N	\N	4	2026-06-02 18:31:45.27169
1630	3	3	994	46	Adjustment	128	128	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.920395
1631	3	3	995	46	Adjustment	376	376	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.922425
1632	3	3	996	46	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.924357
1633	3	3	997	46	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.926266
1634	3	3	998	46	Adjustment	342	342	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.928324
1635	3	3	999	46	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.930258
1636	3	3	1000	46	Adjustment	286	286	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.932353
1637	3	3	1001	46	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.93428
1638	3	3	1002	46	Adjustment	239	239	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.936489
1639	3	3	1003	46	Adjustment	27	27	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.938734
1640	3	3	1004	46	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.940727
1641	3	3	1005	46	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.942604
1642	3	3	1006	46	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.944703
1643	3	3	1007	46	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.946656
1644	3	3	1008	46	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.948824
1645	3	3	1009	46	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.950749
1646	3	3	1010	46	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.952978
1647	3	3	1011	46	Adjustment	421	421	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.955193
1648	3	3	1012	46	Adjustment	93	93	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.957161
1649	3	3	1013	46	Adjustment	24	24	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.958996
1650	3	3	1014	46	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.961024
1651	3	3	1015	46	Adjustment	899	899	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.962983
1652	3	3	1016	46	Adjustment	139	139	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.964868
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
1653	3	3	1017	46	Adjustment	99	99	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.966819
1654	3	3	1018	46	Adjustment	902	902	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.968762
1655	3	3	1019	46	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.970937
1656	3	3	1020	46	Adjustment	130	130	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.973037
1657	3	3	1021	46	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.97499
1658	3	3	1022	46	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.977007
1659	3	3	1023	46	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.978956
1660	3	3	1024	46	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.981124
1661	3	3	1025	46	Adjustment	109	109	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.983069
1662	3	3	1026	46	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.984982
1663	3	3	1027	46	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.987244
1664	3	3	1028	46	Adjustment	83	83	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.989373
1665	3	3	1029	46	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.99128
1666	3	3	1030	46	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.993187
1667	3	3	1031	46	Adjustment	495	495	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.99531
1668	3	3	1032	46	Adjustment	52	52	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.997314
1669	3	3	1033	46	Adjustment	139	139	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:53.999365
1670	3	3	1034	46	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.001305
1671	3	3	1035	46	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.003534
1672	3	3	1036	46	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.005705
1673	3	3	1037	46	Adjustment	903	903	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.007666
1674	3	3	1038	46	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.009518
1675	3	3	1039	46	Adjustment	774	774	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.01162
1676	3	3	1040	59	Adjustment	109	109	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.013545
1677	3	3	1041	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.015572
1678	3	3	1042	59	Adjustment	147	147	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.017525
1679	3	3	1043	59	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.019556
1680	3	3	1044	59	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.021743
1681	3	3	1045	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.023747
1682	3	3	1046	59	Adjustment	132	132	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.025701
1683	3	3	1047	59	Adjustment	89	89	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.027773
1684	3	3	1048	59	Adjustment	850	850	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.029741
1685	3	3	1049	59	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.031629
1686	3	3	1050	59	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.03368
875	3	3	246	59	Return	1	85	Return	10	RET-00003	1	\N	\N	4	2026-05-20 12:51:33.816814
882	3	3	232	50	Issue	-40	8	Issue	210	ISS-00025	1	1	\N	4	2026-05-26 18:25:34.29287
1687	3	3	1051	59	Adjustment	52	52	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.035621
1688	3	3	1052	59	Adjustment	65	65	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.038946
1689	3	3	1053	59	Adjustment	102	102	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.041003
1690	3	3	1054	59	Adjustment	105	105	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.042943
1691	3	3	1055	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.044977
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
1692	3	3	1056	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.046927
1693	3	3	1057	59	Adjustment	119	119	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.048898
1694	3	3	1058	59	Adjustment	149	149	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.050926
1695	3	3	1059	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.053024
1696	3	3	1060	59	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.055292
1697	3	3	1061	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.057285
1698	3	3	1062	59	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.059185
1699	3	3	1063	59	Adjustment	113	113	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.061233
1700	3	3	1064	59	Adjustment	363	363	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.063184
1701	3	3	1065	59	Adjustment	64	64	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.065049
1702	3	3	1066	59	Adjustment	139	139	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.067047
1703	3	3	1067	59	Adjustment	179	179	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.068971
1704	3	3	1068	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.071194
1705	3	3	1069	59	Adjustment	60	60	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.073228
1706	3	3	1070	59	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.07514
1707	3	3	1071	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.077063
1708	3	3	1072	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.079014
1709	3	3	1073	59	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.080853
1710	3	3	1074	59	Adjustment	86	86	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.082861
1711	3	3	1075	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.084823
1712	3	3	1076	59	Adjustment	38	38	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.086972
1713	3	3	1077	59	Adjustment	114	114	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.089177
1714	3	3	1078	59	Adjustment	103	103	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.091131
1715	3	3	1079	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.092971
1716	3	3	1080	59	Adjustment	136	136	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.095218
1717	3	3	1081	59	Adjustment	88	88	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.097186
1718	3	3	1082	59	Adjustment	135	135	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.099158
1719	3	3	1083	59	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.101152
1720	3	3	1084	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.103155
1721	3	3	1085	59	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.105416
1722	3	3	1086	59	Adjustment	20	20	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.107468
1723	3	3	1087	59	Adjustment	95	95	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.109363
1724	3	3	1088	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.111412
1725	3	3	1089	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.113399
1726	3	3	1090	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.115337
1727	3	3	1091	59	Adjustment	46	46	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.117347
1728	3	3	1092	59	Adjustment	120	120	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.11934
1729	3	3	1093	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.121473
1730	3	3	1094	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.123606
1731	3	3	1095	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.125515
1732	3	3	1096	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.127489
1733	3	3	1097	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.129475
1734	3	3	1098	59	Adjustment	276	276	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.131233
1735	3	3	1099	59	Adjustment	88	88	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.133383
1736	3	3	1100	59	Adjustment	588	588	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.135367
1737	3	3	1101	59	Adjustment	74	74	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.137593
1738	3	3	1102	59	Adjustment	512	512	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.139764
1739	3	3	1103	59	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.14173
1740	3	3	1104	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.143743
1741	3	3	1105	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.146004
1742	3	3	1106	59	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.148141
1743	3	3	1107	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.150559
1744	3	3	1108	59	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.152692
1745	3	3	1109	59	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.155051
1746	3	3	1110	59	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.157107
1747	3	3	1111	59	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.159007
1748	3	3	1112	59	Adjustment	118	118	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.161015
1749	3	3	1113	59	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.163194
1750	3	3	1114	59	Adjustment	46	46	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.165154
1751	3	3	1115	59	Adjustment	80	80	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.167324
1752	3	3	1116	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.169296
1753	3	3	1117	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.171639
1754	3	3	1118	59	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.173747
1755	3	3	1119	59	Adjustment	756	756	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.17567
1756	3	3	1120	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.177672
1757	3	3	1121	59	Adjustment	921	921	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.179734
1758	3	3	1122	59	Adjustment	94	94	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.181709
1759	3	3	1123	59	Adjustment	228	228	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.183955
1760	3	3	1124	59	Adjustment	65	65	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.185901
1761	3	3	1125	59	Adjustment	192	192	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.188343
1762	3	3	1126	59	Adjustment	104	104	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.190728
1763	3	3	1127	59	Adjustment	324	324	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.19271
1764	3	3	1128	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.194571
1765	3	3	1129	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.196475
1766	3	3	1130	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.198328
1767	3	3	1131	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.200323
1768	3	3	1132	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.202303
1769	3	3	1133	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.204589
1770	3	3	1134	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.206924
1771	3	3	1135	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.209083
1772	3	3	1136	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.211124
1773	3	3	1137	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.21302
1774	3	3	1138	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.214949
1775	3	3	1139	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.217114
1776	3	3	1140	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.219106
1777	3	3	1141	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.221577
1778	3	3	1142	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.224035
1779	3	3	1143	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.226346
1780	3	3	1144	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.228397
1781	3	3	1145	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.230765
1782	3	3	1146	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.232999
1783	3	3	1147	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.235173
1784	3	3	1148	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.23735
1785	3	3	1149	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.239817
1786	3	3	1150	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.242133
1787	3	3	1151	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.244508
1788	3	3	1152	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.246963
1789	3	3	1153	59	Adjustment	96	96	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.248916
1790	3	3	1154	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.251076
1791	3	3	1155	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.253092
1792	3	3	1156	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.255542
1793	3	3	1157	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.257707
1794	3	3	1158	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.259834
1795	3	3	1159	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.261764
1796	3	3	1160	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.263647
1797	3	3	1161	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.265692
1798	3	3	1162	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.268077
1799	3	3	1163	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.270566
1800	3	3	1164	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.272994
1801	3	3	1165	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.275012
1802	3	3	1166	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.276993
1803	3	3	1167	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.2789
1804	3	3	1168	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.280799
1805	3	3	1169	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.282664
1806	3	3	1170	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.284659
1807	3	3	1171	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.286592
1808	3	3	1172	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.289034
1809	3	3	1173	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.291178
1810	3	3	1174	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.29315
1811	3	3	1175	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.295056
1812	3	3	1176	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.296851
1813	3	3	1177	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.298753
1814	3	3	1178	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.300897
1815	3	3	1179	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.302926
1816	3	3	1180	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.305418
1817	3	3	1181	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.30757
1818	3	3	1182	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.309505
1819	3	3	1183	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.311422
1820	3	3	1184	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.313298
1821	3	3	1185	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.315218
1822	3	3	1186	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.317239
1823	3	3	1187	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.319164
1824	3	3	1188	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.321469
1825	3	3	1189	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.323775
1826	3	3	1190	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.325813
1827	3	3	1191	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.327723
1828	3	3	1192	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.329589
1829	3	3	1193	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.331499
1830	3	3	1194	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.333404
1831	3	3	1195	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.335439
1832	3	3	1196	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.337538
1833	3	3	1197	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.339999
1834	3	3	1198	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.342028
1835	3	3	1199	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.343973
1836	3	3	1200	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.345901
1837	3	3	1201	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.347825
1838	3	3	1202	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.349819
1839	3	3	1203	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.351857
1840	3	3	1204	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.353932
1841	3	3	1205	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.356411
1842	3	3	1206	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.358505
1843	3	3	1207	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.360431
1844	3	3	1208	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.362332
1845	3	3	1209	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.364282
1846	3	3	1210	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.366217
1847	3	3	1211	59	Adjustment	89	89	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.368213
1848	3	3	1212	59	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.370195
1849	3	3	1213	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.372684
1850	3	3	1214	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.374834
1851	3	3	1215	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.376799
1852	3	3	1216	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.378722
1853	3	3	1217	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.380636
1854	3	3	1218	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.382564
1855	3	3	1219	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.384578
1856	3	3	1220	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.38661
1857	3	3	1221	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.389029
1858	3	3	1222	59	Adjustment	89	89	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.391209
1859	3	3	1223	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.393178
1860	3	3	1224	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.395078
1861	3	3	1225	59	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.396996
1862	3	3	1226	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.39885
1863	3	3	1227	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.400943
1864	3	3	1228	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.402882
1865	3	3	1229	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.405178
1866	3	3	1230	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.407495
1867	3	3	1231	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.409467
1868	3	3	1232	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.411407
1869	3	3	1233	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.413298
1870	3	3	1234	59	Adjustment	105	105	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.415208
1871	3	3	1235	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.417213
1872	3	3	1236	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.419216
1873	3	3	1237	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.421325
1874	3	3	1238	59	Adjustment	49	49	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.423694
1875	3	3	1239	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.425742
1876	3	3	1240	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.42768
1877	3	3	1241	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.429597
1878	3	3	1242	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.431522
1879	3	3	1243	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.433437
1880	3	3	1244	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.435531
1881	3	3	1245	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.437563
1882	3	3	1246	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.440019
1883	3	3	1247	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.442147
1884	3	3	1248	59	Adjustment	60	60	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.444104
1885	3	3	1249	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.445896
1886	3	3	1250	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.447804
1887	3	3	1251	59	Adjustment	20	20	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.449647
1888	3	3	1252	59	Adjustment	78	78	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.451704
1889	3	3	1253	59	Adjustment	49	49	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.453683
1890	3	3	1254	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.456141
1891	3	3	1255	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.458326
1892	3	3	1256	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.460325
1893	3	3	1257	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.462297
1894	3	3	1258	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.464182
1895	3	3	1259	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.466117
1896	3	3	1260	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.468149
1897	3	3	1261	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.470135
1898	3	3	1262	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.472722
1899	3	3	1263	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.474952
1900	3	3	1264	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.476914
1901	3	3	1265	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.478864
1902	3	3	1266	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.480728
1903	3	3	1267	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.482659
1904	3	3	1268	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.484714
1905	3	3	1269	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.486734
1906	3	3	1270	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.489151
1907	3	3	1271	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.491372
1908	3	3	1272	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.493357
1909	3	3	1273	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.495217
1910	3	3	1274	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.497099
1911	3	3	1275	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.498994
1912	3	3	1276	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.501006
1913	3	3	1277	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.503098
1914	3	3	1278	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.50536
1915	3	3	1279	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.507736
1916	3	3	1280	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.50974
1917	3	3	1281	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.511683
1918	3	3	1282	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.513617
1919	3	3	1283	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.515513
1920	3	3	1284	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.5175
1921	3	3	1285	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.519527
1922	3	3	1286	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.521677
1923	3	3	1287	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.524126
1924	3	3	1288	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.526158
1925	3	3	1289	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.528055
1926	3	3	1290	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.529849
1927	3	3	1291	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.531655
1928	3	3	1292	59	Adjustment	154	154	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.533563
1929	3	3	1293	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.535599
1930	3	3	1294	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.537607
1931	3	3	1295	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.540094
1932	3	3	1296	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.542159
1933	3	3	1297	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.544071
1934	3	3	1298	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.545983
1935	3	3	1299	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.547878
1936	3	3	1300	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.549797
1937	3	3	1301	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.551871
1938	3	3	1302	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.553866
1939	3	3	1303	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.556336
1940	3	3	1304	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.558609
1941	3	3	1305	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.560605
1942	3	3	1306	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.562572
1943	3	3	1307	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.564526
1944	3	3	1308	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.566505
1945	3	3	1309	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.568744
1946	3	3	1310	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.570809
1947	3	3	1311	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.57328
1948	3	3	1312	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.575437
1949	3	3	1313	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.577384
1950	3	3	1314	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.579323
1951	3	3	1315	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.581222
1952	3	3	1316	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.583124
1953	3	3	1317	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.585112
1954	3	3	1318	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.587014
1955	3	3	1319	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.58934
1956	3	3	1320	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.591624
1957	3	3	1321	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.593596
1958	3	3	1322	59	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.595521
1959	3	3	1323	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.597376
1960	3	3	1324	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.599295
1961	3	3	1325	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.601272
1962	3	3	1326	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.603302
1963	3	3	1327	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.605525
1964	3	3	1328	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.607939
1965	3	3	1329	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.60997
1966	3	3	1330	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.611905
1967	3	3	1331	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.613818
1968	3	3	1332	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.615713
1969	3	3	1333	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.617666
1970	3	3	1334	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.619679
1971	3	3	1335	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.621696
1972	3	3	1336	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.624133
1973	3	3	1337	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.626152
1974	3	3	1338	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.628026
1975	3	3	1339	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.629861
1976	3	3	1340	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.63172
1977	3	3	1341	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.633643
1978	3	3	1342	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.635677
1979	3	3	1343	59	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.637598
1980	3	3	1344	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.639921
1981	3	3	1345	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.642244
1982	3	3	1346	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.64454
1983	3	3	1347	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.646678
1984	3	3	1348	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.648791
1985	3	3	1349	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.651406
1986	3	3	1350	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.653574
1987	3	3	1351	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.655911
1988	3	3	1352	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.658333
1989	3	3	1353	59	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.660322
1990	3	3	1354	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.662296
1991	3	3	1355	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.664165
1992	3	3	1356	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.666029
1993	3	3	1357	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.668012
1994	3	3	1358	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.669981
1995	3	3	1359	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.672026
1996	3	3	1360	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.674471
1997	3	3	1361	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.676575
1998	3	3	1362	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.678511
1999	3	3	1363	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.680397
2000	3	3	1364	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.682313
2001	3	3	1365	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.684261
2002	3	3	1366	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.686335
2003	3	3	1367	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.688415
2004	3	3	1368	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.690995
2005	3	3	1369	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.693128
2006	3	3	1370	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.695071
2007	3	3	1371	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.697124
2008	3	3	1372	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.699166
2009	3	3	1373	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.701263
2010	3	3	1374	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.703354
2011	3	3	1375	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.705447
2012	3	3	1376	59	Adjustment	70	70	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.707935
2013	3	3	1377	59	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.710022
2014	3	3	1378	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.711972
2015	3	3	1379	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.713819
2016	3	3	1380	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.715719
2017	3	3	1381	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.717611
2018	3	3	1382	59	Adjustment	47	47	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.719644
2019	3	3	1383	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.721667
2020	3	3	1384	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.724211
2021	3	3	1385	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.726328
2022	3	3	1386	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.728299
2023	3	3	1387	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.730211
2024	3	3	1388	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.732187
2025	3	3	1389	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.7341
2026	3	3	1390	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.73614
2027	3	3	1391	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.738061
2028	3	3	1392	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.74049
2029	3	3	1393	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.742601
2030	3	3	1394	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.744487
2031	3	3	1395	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.746353
2032	3	3	1396	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.74829
2033	3	3	1397	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.750212
2034	3	3	1398	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.752298
2035	3	3	1399	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.754328
2036	3	3	1400	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.756826
2037	3	3	1401	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.759112
2038	3	3	1402	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.761119
2039	3	3	1403	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.763087
2040	3	3	1404	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.765003
2041	3	3	1405	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.76689
2042	3	3	1406	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.768911
2043	3	3	1407	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.770921
2044	3	3	1408	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.773253
2045	3	3	1409	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.775617
2046	3	3	1410	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.777621
2047	3	3	1411	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.779512
2048	3	3	1412	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.781468
2049	3	3	1413	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.78339
2050	3	3	1414	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.78548
2051	3	3	1415	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.787431
2052	3	3	1416	59	Adjustment	77	77	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.789752
2053	3	3	1417	59	Adjustment	20	20	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.792128
2054	3	3	1418	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.794133
2055	3	3	1419	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.796071
2056	3	3	1420	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.797901
2057	3	3	1421	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.799844
2058	3	3	1422	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.801882
2059	3	3	1423	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.803885
2060	3	3	1424	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.806096
2061	3	3	1425	59	Adjustment	74	74	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.808514
2062	3	3	1426	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.810482
2063	3	3	1427	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.812434
2064	3	3	1428	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.814364
2065	3	3	1429	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.816297
2066	3	3	1430	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.818275
2067	3	3	1431	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.820281
2068	3	3	1432	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.822346
2069	3	3	1433	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.824763
2070	3	3	1434	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.826872
2071	3	3	1435	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.828814
2072	3	3	1436	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.830753
2073	3	3	1437	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.832642
2074	3	3	1438	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.834552
2075	3	3	1439	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.836668
2076	3	3	1440	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.838752
2077	3	3	1441	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.841264
2078	3	3	1442	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.843396
2079	3	3	1443	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.845395
2080	3	3	1444	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.847361
2081	3	3	1445	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.849326
2082	3	3	1446	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.851406
2083	3	3	1447	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.853502
2084	3	3	1448	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.855595
2085	3	3	1449	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.858092
2086	3	3	1450	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.860302
2087	3	3	1451	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.862303
2088	3	3	1452	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.864265
2089	3	3	1453	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.866205
2090	3	3	1454	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.868241
2091	3	3	1455	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.870337
2092	3	3	1456	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.872408
2093	3	3	1457	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.874916
2094	3	3	1458	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.87702
2095	3	3	1459	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.87903
2096	3	3	1460	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.881001
2097	3	3	1461	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.882919
2098	3	3	1462	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.884969
2099	3	3	1463	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.887062
2100	3	3	1464	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.889102
2101	3	3	1465	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.891636
2102	3	3	1466	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.893767
2103	3	3	1467	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.895747
2104	3	3	1468	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.897688
2105	3	3	1469	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.899612
2106	3	3	1470	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.901696
2107	3	3	1471	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.90376
2108	3	3	1472	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.905902
2109	3	3	1473	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.908436
2110	3	3	1474	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.91058
2111	3	3	1475	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.912582
2112	3	3	1476	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.91451
2113	3	3	1477	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.916398
2114	3	3	1478	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.9184
2115	3	3	1479	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.920618
2116	3	3	1480	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.922808
2117	3	3	1481	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.925336
2118	3	3	1482	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.927405
2119	3	3	1483	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.929388
2120	3	3	1484	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.931338
2121	3	3	1485	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.933301
2122	3	3	1486	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.935272
2123	3	3	1487	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.937346
2124	3	3	1488	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.939472
2125	3	3	1489	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.941976
2126	3	3	1490	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.944117
2127	3	3	1491	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.946104
2128	3	3	1492	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.948034
2129	3	3	1493	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.949936
2130	3	3	1494	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.951988
2131	3	3	1495	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.954062
2132	3	3	1496	59	Adjustment	66	66	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.956247
2133	3	3	1497	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.958767
2134	3	3	1498	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.960859
2135	3	3	1499	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.962172
2136	3	3	1500	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.966038
2137	3	3	1501	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.967973
2138	3	3	1502	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.970177
2139	3	3	1503	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.972351
2140	3	3	1504	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.97494
2141	3	3	1505	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.977108
2142	3	3	1506	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.979138
2143	3	3	1507	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.981309
2144	3	3	1508	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.983308
2145	3	3	1509	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.985345
2146	3	3	1510	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.987441
2147	3	3	1511	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.989518
2148	3	3	1512	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.992019
2149	3	3	1513	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.994185
2150	3	3	1514	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.99618
2151	3	3	1515	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:54.998105
2152	3	3	1516	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.000053
2153	3	3	1517	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.002074
2154	3	3	1518	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.004147
2155	3	3	1519	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.006183
2156	3	3	1520	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.008569
2157	3	3	1521	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.010669
2158	3	3	1522	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.012786
2159	3	3	1523	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.01475
2160	3	3	1524	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.016691
2161	3	3	1525	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.018761
2162	3	3	1526	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.020813
2163	3	3	1527	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.023187
2164	3	3	1528	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.025711
2165	3	3	1529	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.027836
2166	3	3	1530	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.029832
2167	3	3	1531	59	Adjustment	89	89	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.031736
2168	3	3	1532	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.033705
2169	3	3	1533	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.035673
2170	3	3	1534	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.037864
2171	3	3	1535	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.040023
2172	3	3	1536	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.042568
2173	3	3	1537	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.044715
2174	3	3	1538	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.046695
2175	3	3	1539	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.048628
2176	3	3	1540	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.050551
2177	3	3	1541	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.05244
2178	3	3	1542	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.054672
2179	3	3	1543	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.05688
2180	3	3	1544	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.059374
2181	3	3	1545	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.062093
2182	3	3	1546	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.064131
2183	3	3	1547	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.066114
2184	3	3	1548	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.068018
2185	3	3	1549	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.070196
2186	3	3	1550	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.072247
2187	3	3	1551	59	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.074782
2188	3	3	1552	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.077043
2189	3	3	1553	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.079001
2190	3	3	1554	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.081006
2191	3	3	1555	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.082957
2192	3	3	1556	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.084885
2193	3	3	1557	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.086953
2194	3	3	1558	59	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.08898
2195	3	3	1559	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.091459
2196	3	3	1560	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.093736
2197	3	3	1561	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.09578
2198	3	3	1562	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.097745
2199	3	3	1563	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.09969
2200	3	3	1564	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.101666
2201	3	3	1565	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.103847
2202	3	3	1566	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.105804
2203	3	3	1567	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.108291
2204	3	3	1568	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.11052
2205	3	3	1569	59	Adjustment	79	79	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.112453
2206	3	3	1570	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.114426
2207	3	3	1571	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.11639
2208	3	3	1572	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.118355
2209	3	3	1573	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.120535
2210	3	3	1574	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.122501
2211	3	3	1575	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.125005
2212	3	3	1576	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.127255
2213	3	3	1577	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.129256
2214	3	3	1578	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.131207
2215	3	3	1579	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.133159
2216	3	3	1580	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.135049
2217	3	3	1581	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.137109
2218	3	3	1582	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.1392
2219	3	3	1583	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.141736
2220	3	3	1584	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.144019
2221	3	3	1585	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.146206
2222	3	3	1586	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.148428
2223	3	3	1587	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.191752
2224	3	3	1588	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.194043
2225	3	3	1589	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.196017
2226	3	3	1590	59	Adjustment	20	20	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.197916
2227	3	3	1591	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.200305
2228	3	3	1592	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.204394
2229	3	3	1593	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.206474
2230	3	3	1594	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.209078
2231	3	3	1595	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.211283
2232	3	3	1596	59	Adjustment	6	6	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.213329
2233	3	3	1597	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.215289
2234	3	3	1598	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.217256
2235	3	3	1599	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.219137
2236	3	3	1600	59	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.221384
2237	3	3	1601	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.223698
2238	3	3	1602	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.226216
2239	3	3	1603	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.228447
2240	3	3	1604	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.230483
2241	3	3	1605	59	Adjustment	104	104	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.232444
2242	3	3	1606	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.234408
2243	3	3	1607	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.236357
2244	3	3	1608	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.238394
2245	3	3	1609	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.240736
2246	3	3	1610	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.243221
2247	3	3	1611	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.245544
2248	3	3	1612	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.247542
2249	3	3	1613	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.249434
2250	3	3	1614	59	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.251337
2251	3	3	1615	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.253354
2252	3	3	1616	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.255456
2253	3	3	1617	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.258063
2254	3	3	1618	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.260594
2255	3	3	1619	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.262645
2256	3	3	1620	59	Adjustment	4	4	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.264508
2257	3	3	1621	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.266594
2258	3	3	1622	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.268924
2259	3	3	1623	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.271162
2260	3	3	1624	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.273216
2261	3	3	1625	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.274919
2262	3	3	1626	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.278524
2263	3	3	1627	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.280535
2264	3	3	1628	53	Adjustment	95	95	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.282508
2265	3	3	1629	53	Adjustment	70	70	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.284472
2266	3	3	1630	53	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.286395
2267	3	3	1631	53	Adjustment	65	65	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.288488
2268	3	3	1632	53	Adjustment	65	65	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.290622
2269	3	3	1633	53	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.293211
2270	3	3	1634	53	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.295274
2271	3	3	1635	53	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.297245
2272	3	3	1636	53	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.299216
2273	3	3	1637	53	Adjustment	109	109	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.30119
2274	3	3	1638	53	Adjustment	416	416	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.30314
2275	3	3	1639	53	Adjustment	232	232	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.305244
2276	3	3	1640	53	Adjustment	93	93	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.307432
2277	3	3	1641	53	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.31009
2278	3	3	1642	53	Adjustment	66	66	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.312255
2279	3	3	1643	53	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.314263
2280	3	3	1644	53	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.316208
2281	3	3	1645	53	Adjustment	432	432	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.318179
2282	3	3	1646	53	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.320265
2283	3	3	1647	53	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.322352
2284	3	3	1648	53	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.324614
2285	3	3	1649	53	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.327201
2286	3	3	1650	53	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.32929
2287	3	3	1651	53	Adjustment	91	91	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.331262
2288	3	3	1652	53	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.333237
2289	3	3	1653	53	Adjustment	620	620	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.33521
2290	3	3	1654	53	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.337217
2291	3	3	1655	53	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.339266
2292	3	3	1656	53	Adjustment	416	416	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.341724
2293	3	3	1657	53	Adjustment	38	38	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.344152
2294	3	3	1658	53	Adjustment	57	57	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.346227
2295	3	3	1659	53	Adjustment	782	782	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.348207
2296	3	3	1660	53	Adjustment	101	101	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.350169
2297	3	3	1661	53	Adjustment	85	85	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.352235
2298	3	3	1662	53	Adjustment	141	141	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.35438
2299	3	3	1663	53	Adjustment	76	76	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.356634
2300	3	3	1664	53	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.359323
2301	3	3	1665	53	Adjustment	73	73	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.361708
2302	3	3	1666	53	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.363905
2303	3	3	1667	53	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.3661
2304	3	3	1668	53	Adjustment	105	105	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.368219
2305	3	3	1669	53	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.37046
2306	3	3	1670	53	Adjustment	46	46	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.37272
2307	3	3	1671	53	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.375155
2308	3	3	1672	53	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.377765
2309	3	3	1673	53	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.379954
2310	3	3	1674	53	Adjustment	139	139	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.382098
2311	3	3	1675	53	Adjustment	52	52	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.384208
2312	3	3	1676	53	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.386303
2313	3	3	1677	53	Adjustment	34	34	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.388678
2314	3	3	1678	53	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.391006
2315	3	3	1679	53	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.393729
2316	3	3	1680	53	Adjustment	64	64	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.396024
2317	3	3	1681	53	Adjustment	90	90	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.398178
2318	3	3	1682	53	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.400531
2319	3	3	1683	53	Adjustment	93	93	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.402882
2320	3	3	1684	53	Adjustment	70	70	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.405168
2321	3	3	1685	53	Adjustment	78	78	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.407492
2322	3	3	1686	53	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.410237
2323	3	3	1687	53	Adjustment	61	61	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.412491
2324	3	3	1688	53	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.414653
2325	3	3	1689	53	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.416755
2326	3	3	1690	53	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.418878
2327	3	3	1691	53	Adjustment	102	102	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.421076
2328	3	3	1692	53	Adjustment	78	78	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.423351
2329	3	3	1693	53	Adjustment	265	265	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.426016
2330	3	3	1694	59	Adjustment	619	619	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.428581
2331	3	3	1695	59	Adjustment	24	24	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.430719
2332	3	3	1696	59	Adjustment	95	95	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.432857
2333	3	3	1697	59	Adjustment	64	64	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.434953
2334	3	3	1698	59	Adjustment	90	90	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.437083
2335	3	3	1699	59	Adjustment	225	225	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.439369
2336	3	3	1700	59	Adjustment	132	132	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.441797
2337	3	3	1701	59	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.444481
2338	3	3	1702	59	Adjustment	24	24	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.446739
2339	3	3	1703	59	Adjustment	135	135	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.448883
2340	3	3	1704	59	Adjustment	566	566	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.451003
2341	3	3	1705	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.453147
2342	3	3	1706	59	Adjustment	43	43	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.455387
2343	3	3	1707	59	Adjustment	113	113	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.457693
2344	3	3	1708	59	Adjustment	49	49	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.460412
2345	3	3	1709	59	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.462752
2346	3	3	1710	59	Adjustment	78	78	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.464939
2347	3	3	1711	59	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.467055
2348	3	3	1712	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.469143
2349	3	3	1713	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.47134
2350	3	3	1714	59	Adjustment	132	132	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.473612
2351	3	3	1715	59	Adjustment	80	80	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.476304
2352	3	3	1716	59	Adjustment	694	694	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.478746
2353	3	3	1717	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.48091
2354	3	3	1718	59	Adjustment	280	280	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.482881
2355	3	3	1719	59	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.484961
2356	3	3	1720	59	Adjustment	72	72	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.487078
2357	3	3	1721	59	Adjustment	171	171	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.489381
2358	3	3	1722	59	Adjustment	118	118	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.491738
2359	3	3	1723	59	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.494422
2360	3	3	1724	59	Adjustment	873	873	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.496531
2361	3	3	1725	59	Adjustment	56	56	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.498607
2362	3	3	1726	59	Adjustment	133	133	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.500537
2363	3	3	1727	59	Adjustment	77	77	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.502469
2364	3	3	1728	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.504403
2365	3	3	1729	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.506528
2366	3	3	1730	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.508867
2367	3	3	1731	59	Adjustment	94	94	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.511363
2368	3	3	1732	59	Adjustment	68	68	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.513353
2369	3	3	1733	59	Adjustment	85	85	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.515318
2370	3	3	1734	59	Adjustment	122	122	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.517296
2371	3	3	1735	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.51923
2372	3	3	1736	59	Adjustment	749	749	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.521242
2373	3	3	1737	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.52349
2374	3	3	1738	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.526145
2375	3	3	1739	59	Adjustment	69	69	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.528661
2376	3	3	1740	59	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.530788
2377	3	3	1741	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.532784
2378	3	3	1742	59	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.534733
2379	3	3	1743	59	Adjustment	98	98	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.536716
2380	3	3	1744	59	Adjustment	263	263	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.538846
2381	3	3	1745	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.54097
2382	3	3	1746	59	Adjustment	251	251	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.543552
2383	3	3	1747	59	Adjustment	71	71	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.545732
2384	3	3	1748	59	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.547806
2385	3	3	1749	59	Adjustment	34	34	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.549832
2386	3	3	1750	59	Adjustment	55	55	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.551792
2387	3	3	1751	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.553804
2388	3	3	1752	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.555929
2389	3	3	1753	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.55834
2390	3	3	1754	59	Adjustment	110	110	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.560969
2391	3	3	1755	59	Adjustment	98	98	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.563091
2392	3	3	1756	59	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.565085
2393	3	3	1757	59	Adjustment	102	102	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.567045
2394	3	3	1758	59	Adjustment	57	57	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.568982
2395	3	3	1759	59	Adjustment	117	117	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.57091
2396	3	3	1760	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.572999
2397	3	3	1761	59	Adjustment	52	52	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.575147
2398	3	3	1762	59	Adjustment	79	79	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.577709
2399	3	3	1763	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.579818
2400	3	3	1764	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.581852
2401	3	3	1765	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.583848
2402	3	3	1766	59	Adjustment	66	66	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.585843
2403	3	3	1767	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.587971
2404	3	3	1768	59	Adjustment	290	290	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.590122
2405	3	3	1769	59	Adjustment	62	62	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.592405
2406	3	3	1770	59	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.594936
2407	3	3	1771	59	Adjustment	883	883	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.596975
2408	3	3	1772	59	Adjustment	62	62	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.598988
2409	3	3	1773	59	Adjustment	80	80	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.600974
2410	3	3	1774	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.602954
2411	3	3	1775	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.605077
2412	3	3	1776	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.607113
2413	3	3	1777	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.60956
2414	3	3	1778	59	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.611966
2415	3	3	1779	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.613928
2416	3	3	1780	59	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.615875
2417	3	3	1781	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.617856
2418	3	3	1782	59	Adjustment	97	97	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.619842
2419	3	3	1783	59	Adjustment	1025	1025	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.621841
2420	3	3	1784	59	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.623894
2421	3	3	1785	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.626457
2422	3	3	1786	59	Adjustment	89	89	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.628822
2423	3	3	1787	59	Adjustment	81	81	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.630889
2424	3	3	1788	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.63285
2425	3	3	1789	59	Adjustment	46	46	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.634908
2426	3	3	1790	59	Adjustment	239	239	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.63695
2427	3	3	1791	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.639078
2428	3	3	1792	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.641185
2429	3	3	1793	59	Adjustment	86	86	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.643746
2430	3	3	1794	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.646141
2431	3	3	1795	59	Adjustment	71	71	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.648359
2432	3	3	1796	59	Adjustment	72	72	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.650694
2433	3	3	1797	59	Adjustment	807	807	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.652985
2434	3	3	1798	59	Adjustment	143	143	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.655458
2435	3	3	1799	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.657673
2436	3	3	1800	59	Adjustment	71	71	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.660265
2437	3	3	1801	59	Adjustment	86	86	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.66259
2438	3	3	1802	59	Adjustment	1009	1009	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.664592
2439	3	3	1803	59	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.666599
2440	3	3	1804	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.668583
2441	3	3	1805	59	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.670536
2442	3	3	1806	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.672562
2443	3	3	1807	59	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.674668
2444	3	3	1808	59	Adjustment	96	96	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.677452
2445	3	3	1809	59	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.679812
2446	3	3	1810	59	Adjustment	72	72	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.681795
2447	3	3	1811	59	Adjustment	57	57	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.683784
2448	3	3	1812	59	Adjustment	128	128	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.685747
2449	3	3	1813	59	Adjustment	78	78	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.687733
2450	3	3	1814	59	Adjustment	55	55	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.689913
2451	3	3	1815	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.692122
2452	3	3	1816	59	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.694685
2453	3	3	1817	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.696875
2454	3	3	1818	59	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.698893
2455	3	3	1819	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.700888
2456	3	3	1820	59	Adjustment	34	34	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.702866
2457	3	3	1821	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.704891
2458	3	3	1822	59	Adjustment	709	709	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.707025
2459	3	3	1823	59	Adjustment	47	47	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.709349
2460	3	3	1824	59	Adjustment	79	79	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.711914
2461	3	3	1825	59	Adjustment	87	87	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.714036
2462	3	3	1826	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.716047
2463	3	3	1827	59	Adjustment	24	24	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.717961
2464	3	3	1828	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.719902
2465	3	3	1829	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.722088
2466	3	3	1830	59	Adjustment	94	94	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.724213
2467	3	3	1831	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.726713
2468	3	3	1832	59	Adjustment	77	77	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.729058
2469	3	3	1833	59	Adjustment	99	99	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.731126
2470	3	3	1834	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.733117
2471	3	3	1835	59	Adjustment	72	72	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.735054
2472	3	3	1836	59	Adjustment	88	88	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.736981
2473	3	3	1837	59	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.739026
2474	3	3	1838	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.74118
2475	3	3	1839	59	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.743758
2476	3	3	1840	59	Adjustment	367	367	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.74609
2477	3	3	1841	59	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.748161
2478	3	3	1842	59	Adjustment	291	291	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.750186
2479	3	3	1843	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.752131
2480	3	3	1844	59	Adjustment	97	97	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.754072
2481	3	3	1845	59	Adjustment	81	81	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.756165
2482	3	3	1846	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.758166
2483	3	3	1847	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.76074
2484	3	3	1848	59	Adjustment	57	57	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.762986
2485	3	3	1849	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.765209
2486	3	3	1850	59	Adjustment	82	82	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.767193
2487	3	3	1851	59	Adjustment	562	562	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.769221
2488	3	3	1852	59	Adjustment	56	56	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.77117
2489	3	3	1853	59	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.77325
2490	3	3	1854	59	Adjustment	81	81	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.775352
2491	3	3	1855	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.777986
2492	3	3	1856	59	Adjustment	5	5	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.780184
2493	3	3	1857	59	Adjustment	99	99	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.782215
2494	3	3	1858	59	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.784162
2495	3	3	1859	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.786056
2496	3	3	1860	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.788036
2497	3	3	1861	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.790125
2498	3	3	1862	59	Adjustment	46	46	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.792162
2499	3	3	1863	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.794718
2500	3	3	1864	59	Adjustment	88	88	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.796894
2501	3	3	1865	59	Adjustment	55	55	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.798945
2502	3	3	1866	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.800995
2503	3	3	1867	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.802978
2504	3	3	1868	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.804913
2505	3	3	1869	59	Adjustment	182	182	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.807101
2506	3	3	1870	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.809378
2507	3	3	1871	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.81195
2508	3	3	1872	59	Adjustment	47	47	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.814076
2509	3	3	1873	59	Adjustment	83	83	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.816086
2510	3	3	1874	59	Adjustment	120	120	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.818038
2511	3	3	1875	59	Adjustment	100	100	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.819952
2512	3	3	1876	59	Adjustment	76	76	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.82189
2513	3	3	1877	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.824037
2514	3	3	1878	59	Adjustment	88	88	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.826301
2515	3	3	1879	59	Adjustment	1148	1148	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.828914
2516	3	3	1880	59	Adjustment	27	27	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.83102
2517	3	3	1881	59	Adjustment	86	86	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.833045
2518	3	3	1882	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.834967
2519	3	3	1883	59	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.836937
2520	3	3	1884	59	Adjustment	43	43	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.838948
2521	3	3	1885	59	Adjustment	105	105	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.841094
2522	3	3	1886	59	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.843556
2523	3	3	1887	59	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.846063
2524	3	3	1888	59	Adjustment	124	124	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.848179
2525	3	3	1889	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.850188
2526	3	3	1890	59	Adjustment	121	121	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.852222
2527	3	3	1891	59	Adjustment	62	62	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.854218
2528	3	3	1892	59	Adjustment	113	113	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.85627
2529	3	3	1893	59	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.858385
2530	3	3	1894	59	Adjustment	43	43	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.860958
2531	3	3	1895	59	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.863278
2532	3	3	1896	59	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.865345
2533	3	3	1897	59	Adjustment	532	532	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.867384
2534	3	3	1898	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.869385
2535	3	3	1899	59	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.871379
2536	3	3	1900	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.873495
2537	3	3	1901	59	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.875626
2538	3	3	1902	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.878153
2539	3	3	1903	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.880373
2540	3	3	1904	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.882426
2541	3	3	1905	59	Adjustment	38	38	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.884423
2542	3	3	1906	59	Adjustment	398	398	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.886412
2543	3	3	1907	59	Adjustment	80	80	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.888437
2544	3	3	1908	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.890613
2545	3	3	1909	59	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.89282
2546	3	3	1910	59	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.895506
2547	3	3	1911	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.897707
2548	3	3	1912	59	Adjustment	52	52	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.899717
2549	3	3	1913	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.901705
2550	3	3	1914	59	Adjustment	60	60	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.903705
2551	3	3	1915	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.905745
2552	3	3	1916	59	Adjustment	464	464	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.907919
2553	3	3	1917	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.910279
2554	3	3	1918	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.926408
2555	3	3	1919	59	Adjustment	79	79	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.929377
2556	3	3	1920	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.932085
2557	3	3	1921	59	Adjustment	78	78	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.934641
2558	3	3	1922	59	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.937151
2559	3	3	1923	59	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.939775
2560	3	3	1924	59	Adjustment	129	129	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.942531
2561	3	3	1925	59	Adjustment	90	90	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.945652
2562	3	3	1926	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.948418
2563	3	3	1927	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.950995
2564	3	3	1928	59	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.953579
2565	3	3	1929	59	Adjustment	495	495	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.956183
2566	3	3	1930	59	Adjustment	64	64	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.958806
2567	3	3	1931	59	Adjustment	913	913	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.961901
2568	3	3	1932	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.964757
2569	3	3	1933	59	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.967366
2570	3	3	1934	59	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.969925
2571	3	3	1935	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.972654
2572	3	3	1936	59	Adjustment	76	76	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.975409
2573	3	3	1937	59	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.978471
2574	3	3	1938	59	Adjustment	70	70	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.981236
2575	3	3	1939	59	Adjustment	107	107	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.983827
2576	3	3	1940	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.986381
2577	3	3	1941	59	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.988894
2578	3	3	1942	59	Adjustment	93	93	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.991527
2579	3	3	1943	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.994652
2580	3	3	1944	59	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:55.997583
2581	3	3	1945	59	Adjustment	16	16	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.000155
2582	3	3	1946	59	Adjustment	70	70	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.002736
2583	3	3	1947	59	Adjustment	55	55	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.005258
2584	3	3	1948	59	Adjustment	86	86	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.007957
2585	3	3	1949	59	Adjustment	39	39	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.010957
2586	3	3	1950	59	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.014022
2587	3	3	1951	59	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.016641
2588	3	3	1952	59	Adjustment	133	133	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.019224
2589	3	3	1953	59	Adjustment	89	89	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.021864
2590	3	3	1954	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.024612
2591	3	3	1955	59	Adjustment	144	144	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.027587
2592	3	3	1956	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.030626
2593	3	3	1957	59	Adjustment	17	17	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.033239
2594	3	3	1958	59	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.035833
2595	3	3	1959	59	Adjustment	99	99	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.038495
2596	3	3	1960	59	Adjustment	76	76	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.041246
2597	3	3	1961	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.044207
2598	3	3	1962	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.047317
2599	3	3	1963	59	Adjustment	43	43	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.050009
2600	3	3	1964	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.052595
2601	3	3	1965	59	Adjustment	12	12	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.055152
2602	3	3	1966	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.057835
2603	3	3	1967	59	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.060759
2604	3	3	1968	59	Adjustment	64	64	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.063875
2605	3	3	1969	59	Adjustment	76	76	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.066548
2606	3	3	1970	59	Adjustment	104	104	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.069211
2607	3	3	1971	59	Adjustment	90	90	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.071767
2608	3	3	1972	59	Adjustment	3	3	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.074492
2609	3	3	1973	59	Adjustment	286	286	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.077387
2610	3	3	1974	59	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.080582
2611	3	3	1975	59	Adjustment	159	159	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.083266
2612	3	3	1976	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.085846
2613	3	3	1977	59	Adjustment	127	127	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.088533
2614	3	3	1978	59	Adjustment	335	335	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.091383
2615	3	3	1979	59	Adjustment	131	131	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.094313
2616	3	3	1980	59	Adjustment	938	938	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.097371
2617	3	3	1981	59	Adjustment	609	609	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.100063
2618	3	3	1982	59	Adjustment	87	87	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.102697
2619	3	3	1983	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.105283
2620	3	3	1984	59	Adjustment	58	58	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.108098
2621	3	3	1985	59	Adjustment	720	720	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.111028
2622	3	3	1986	59	Adjustment	160	160	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.11411
2623	3	3	1987	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.116793
2624	3	3	1988	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.119397
2625	3	3	1989	59	Adjustment	93	93	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.121976
2626	3	3	1990	59	Adjustment	66	66	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.124799
2627	3	3	1991	59	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.127857
2628	3	3	1992	59	Adjustment	69	69	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.130918
2629	3	3	1993	59	Adjustment	27	27	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.133569
2630	3	3	1994	59	Adjustment	10	10	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.136149
2631	3	3	1995	59	Adjustment	46	46	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.138696
2632	3	3	1996	59	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.141397
2633	3	3	1997	59	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.144245
2634	3	3	1998	59	Adjustment	13	13	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.147369
2635	3	3	1999	59	Adjustment	27	27	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.150173
2636	3	3	2000	53	Adjustment	775	775	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.153044
2637	3	3	2001	53	Adjustment	275	275	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.156058
2638	3	3	2002	53	Adjustment	63	63	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.159384
2639	3	3	2003	53	Adjustment	45	45	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.162755
2640	3	3	2004	53	Adjustment	196	196	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.165678
2641	3	3	2005	53	Adjustment	322	322	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.168252
2642	3	3	2006	53	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.170805
2643	3	3	2007	53	Adjustment	165	165	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.173494
2644	3	3	2008	53	Adjustment	506	506	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.176173
2645	3	3	2009	53	Adjustment	482	482	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.179416
2646	3	3	2010	53	Adjustment	305	305	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.182269
2647	3	3	2011	53	Adjustment	15	15	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.184869
2648	3	3	2012	53	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.18744
2649	3	3	2013	53	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.189996
2650	3	3	2014	53	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.192916
2651	3	3	2015	53	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.196127
2652	3	3	2016	53	Adjustment	117	117	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.19891
2653	3	3	2017	53	Adjustment	498	498	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.201508
2654	3	3	2018	53	Adjustment	55	55	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.204118
2655	3	3	2019	53	Adjustment	542	542	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.206793
2656	3	3	2020	53	Adjustment	125	125	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.209645
2657	3	3	2021	53	Adjustment	119	119	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.21279
2658	3	3	2022	53	Adjustment	1	1	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.215629
2659	3	3	2023	53	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.21826
2660	3	3	2024	53	Adjustment	224	224	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.220831
2661	3	3	2025	53	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.223509
2662	3	3	2026	53	Adjustment	151	151	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.226699
2663	3	3	2027	53	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.230255
2664	3	3	2028	53	Adjustment	123	123	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.233399
2665	3	3	2029	53	Adjustment	947	947	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.236239
2666	3	3	2030	53	Adjustment	119	119	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.239
2667	3	3	2031	53	Adjustment	709	709	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.242069
2668	3	3	2032	53	Adjustment	11	11	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.245234
2669	3	3	2033	53	Adjustment	382	382	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.248442
2670	3	3	2034	53	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.251093
2671	3	3	2035	53	Adjustment	598	598	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.253475
2672	3	3	2036	59	Adjustment	24	24	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.255798
2673	3	3	2037	59	Adjustment	86	86	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.258363
2674	3	3	2038	59	Adjustment	179	179	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.260951
2675	3	3	2039	59	Adjustment	53	53	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.263845
2676	3	3	2040	59	Adjustment	34	34	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.266262
2677	3	3	2041	59	Adjustment	765	765	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.268974
2678	3	3	2042	59	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.271486
2679	3	3	2043	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.273894
2680	3	3	2044	59	Adjustment	35	35	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.276395
2681	3	3	2045	59	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.279337
2682	3	3	2046	59	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.281891
2683	3	3	2047	59	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.284222
2684	3	3	2048	59	Adjustment	40	40	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.286517
2685	3	3	2049	59	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.288781
2686	3	3	2050	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.291247
2687	3	3	2051	59	Adjustment	31	31	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.29372
2688	3	3	2052	59	Adjustment	59	59	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.296572
2689	3	3	2053	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.299019
2690	3	3	2054	59	Adjustment	65	65	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.301503
2691	3	3	2055	59	Adjustment	71	71	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.303808
2692	3	3	2056	59	Adjustment	736	736	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.306099
2693	3	3	2057	59	Adjustment	8	8	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.308431
2694	3	3	2058	59	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.310974
2695	3	3	2059	59	Adjustment	242	242	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.31383
2696	3	3	2060	59	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.316293
2697	3	3	2061	59	Adjustment	151	151	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.319328
2698	3	3	2062	59	Adjustment	476	476	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.321646
2699	3	3	2063	59	Adjustment	277	277	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.324023
2700	3	3	2064	59	Adjustment	47	47	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.326455
2701	3	3	2065	59	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.32931
2702	3	3	2066	59	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.331935
2703	3	3	2067	59	Adjustment	159	159	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.334251
2704	3	3	2068	59	Adjustment	188	188	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.33655
2705	3	3	2069	59	Adjustment	210	210	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.338768
2706	3	3	2070	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.341113
2707	3	3	2071	59	Adjustment	351	351	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.343589
2708	3	3	2072	59	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.346578
2709	3	3	2073	59	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.349154
2710	3	3	2074	59	Adjustment	221	221	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.35158
2711	3	3	2075	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.353924
2712	3	3	2076	59	Adjustment	14	14	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.356215
2713	3	3	2077	59	Adjustment	102	102	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.358649
2714	3	3	2078	59	Adjustment	246	246	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.361174
2715	3	3	2079	59	Adjustment	138	138	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.364105
2716	3	3	2080	59	Adjustment	1093	1093	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.366561
2717	3	3	2081	59	Adjustment	413	413	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.368886
2718	3	3	2082	59	Adjustment	106	106	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.371197
2719	3	3	2083	59	Adjustment	69	69	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.373495
2720	3	3	2084	59	Adjustment	82	82	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.376022
2721	3	3	2085	59	Adjustment	132	132	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.378702
2722	3	3	2086	59	Adjustment	54	54	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.381486
2723	3	3	2087	59	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.383871
2724	3	3	2088	59	Adjustment	840	840	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.386212
2725	3	3	2089	59	Adjustment	65	65	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.388495
2726	3	3	2090	59	Adjustment	62	62	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.390819
2727	3	3	2091	59	Adjustment	38	38	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.393298
2728	3	3	2092	59	Adjustment	105	105	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.396201
2729	3	3	2093	59	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.398834
2730	3	3	2094	59	Adjustment	100	100	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.401239
2731	3	3	2095	59	Adjustment	294	294	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.403556
2732	3	3	2096	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.405854
2733	3	3	2097	59	Adjustment	124	124	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.408271
2734	3	3	2098	59	Adjustment	81	81	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.410804
2735	3	3	2099	59	Adjustment	140	140	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.413747
2736	3	3	2100	59	Adjustment	81	81	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.416224
2737	3	3	2101	59	Adjustment	30	30	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.418538
2738	3	3	2102	59	Adjustment	33	33	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.420816
2739	3	3	2103	59	Adjustment	47	47	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.423393
2740	3	3	2104	59	Adjustment	114	114	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.426055
2741	3	3	2105	59	Adjustment	9	9	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.428976
2742	3	3	2106	59	Adjustment	43	43	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.431814
2743	3	3	2107	59	Adjustment	7	7	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.434185
2744	3	3	2108	59	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.436488
2745	3	3	2109	59	Adjustment	84	84	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.438765
2746	3	3	2110	59	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.441068
2747	3	3	2111	59	Adjustment	68	68	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.443539
2748	3	3	2112	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.446402
2749	3	3	2113	59	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.449028
2750	3	3	2114	59	Adjustment	27	27	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.451409
2751	3	3	2115	59	Adjustment	67	67	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.453747
2752	3	3	2116	59	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.456062
2753	3	3	2117	59	Adjustment	1298	1298	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.458485
2754	3	3	2118	59	Adjustment	37	37	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.460974
2755	3	3	2119	59	Adjustment	774	774	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.463917
2756	3	3	2120	59	Adjustment	112	112	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.466451
2757	3	3	2121	59	Adjustment	22	22	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.46878
2758	3	3	2122	59	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.471063
2759	3	3	2123	59	Adjustment	28	28	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.473376
2760	3	3	2124	59	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.475821
2761	3	3	2125	59	Adjustment	149	149	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.478437
2762	3	3	2126	59	Adjustment	163	163	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.481454
2763	3	3	2127	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.483885
2764	3	3	2128	59	Adjustment	44	44	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.486195
2765	3	3	2129	59	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.488498
2766	3	3	2130	59	Adjustment	66	66	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.49084
2767	3	3	2131	59	Adjustment	68	68	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.493382
2768	3	3	2132	59	Adjustment	29	29	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.496193
2769	3	3	2133	59	Adjustment	1387	1387	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.499065
2770	3	3	2134	59	Adjustment	138	138	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.501463
2771	3	3	2135	59	Adjustment	108	108	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.503802
2772	3	3	2136	59	Adjustment	21	21	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.506062
2773	3	3	2137	59	Adjustment	1139	1139	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.508457
2774	3	3	2138	59	Adjustment	32	32	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.510965
2775	3	3	2139	59	Adjustment	41	41	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.513911
2776	3	3	2140	51	Adjustment	756	756	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.516453
2777	3	3	2141	51	Adjustment	48	48	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.518779
2778	3	3	2142	51	Adjustment	630	630	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.521107
2779	3	3	2143	51	Adjustment	521	521	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.523454
2780	3	3	2144	51	Adjustment	110	110	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.525898
2781	3	3	2145	51	Adjustment	23	23	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.528552
2782	3	3	2146	51	Adjustment	645	645	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.531486
2783	3	3	2147	51	Adjustment	923	923	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.533984
2784	3	3	2148	51	Adjustment	906	906	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.536293
2785	3	3	2149	51	Adjustment	113	113	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.538587
2786	3	3	2150	51	Adjustment	651	651	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.540832
2787	3	3	2151	51	Adjustment	750	750	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.543299
2788	3	3	2152	51	Adjustment	129	129	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.54613
2789	3	3	2153	51	Adjustment	253	253	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.548895
2790	3	3	2154	51	Adjustment	1075	1075	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.551346
2791	3	3	2155	51	Adjustment	263	263	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.553732
2792	3	3	2156	51	Adjustment	336	336	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.556067
2793	3	3	2157	51	Adjustment	1065	1065	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.558572
2794	3	3	2158	51	Adjustment	458	458	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.561058
2795	3	3	2159	51	Adjustment	387	387	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.563996
2796	3	3	2160	51	Adjustment	539	539	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.566529
2797	3	3	2161	51	Adjustment	332	332	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.568928
2798	3	3	2162	51	Adjustment	569	569	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.571248
2799	3	3	2163	51	Adjustment	932	932	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.573562
2800	3	3	2164	51	Adjustment	495	495	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.576215
2801	3	3	2165	51	Adjustment	674	674	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.578783
2802	3	3	2166	51	Adjustment	1346	1346	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.581688
2803	3	3	2167	51	Adjustment	128	128	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.5842
2804	3	3	2168	51	Adjustment	427	427	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.586513
2805	3	3	2169	51	Adjustment	419	419	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.588805
2806	3	3	2170	51	Adjustment	196	196	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.591087
2807	3	3	2171	51	Adjustment	1349	1349	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.593504
2808	3	3	2172	51	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.596141
2809	3	3	2173	51	Adjustment	80	80	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.598961
2810	3	3	2174	51	Adjustment	689	689	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.601358
2811	3	3	2175	51	Adjustment	785	785	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.603691
2812	3	3	2176	51	Adjustment	720	720	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.605997
2813	3	3	2177	51	Adjustment	643	643	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.608314
2814	3	3	2178	51	Adjustment	110	110	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.610869
2815	3	3	2179	51	Adjustment	322	322	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.613769
2816	3	3	2180	51	Adjustment	551	551	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.616409
2817	3	3	2181	51	Adjustment	928	928	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.618778
2818	3	3	2182	51	Adjustment	377	377	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.621085
2819	3	3	2183	51	Adjustment	781	781	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.623436
2820	3	3	2184	51	Adjustment	345	345	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.625984
2821	3	3	2185	51	Adjustment	113	113	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.628515
2822	3	3	2186	51	Adjustment	673	673	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.631449
2823	3	3	2187	51	Adjustment	385	385	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.634086
2824	3	3	2188	51	Adjustment	482	482	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.636451
2825	3	3	2189	51	Adjustment	411	411	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.63878
2826	3	3	2190	51	Adjustment	573	573	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.641243
2827	3	3	2191	51	Adjustment	364	364	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.643759
2828	3	3	2192	51	Adjustment	1192	1192	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.646558
2829	3	3	2193	51	Adjustment	771	771	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.649307
2830	3	3	2194	51	Adjustment	1114	1114	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.651901
2831	3	3	2195	51	Adjustment	208	208	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.654558
2832	3	3	2196	51	Adjustment	581	581	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.657123
2833	3	3	2197	51	Adjustment	227	227	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.659999
2834	3	3	2198	51	Adjustment	683	683	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.662767
2835	3	3	2199	51	Adjustment	589	589	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.665702
2836	3	3	2200	51	Adjustment	283	283	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.668157
2837	3	3	2201	51	Adjustment	323	323	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.670458
2838	3	3	2202	51	Adjustment	707	707	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.672741
2839	3	3	2203	51	Adjustment	623	623	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.675167
2840	3	3	2204	51	Adjustment	569	569	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.677592
2841	3	3	2205	51	Adjustment	399	399	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.680408
2842	3	3	2206	51	Adjustment	68	68	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.683157
2843	3	3	2207	51	Adjustment	945	945	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.685534
2844	3	3	2208	51	Adjustment	578	578	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.687776
2845	3	3	2209	51	Adjustment	1036	1036	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.690069
2846	3	3	2210	51	Adjustment	50	50	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.692474
2847	3	3	2211	51	Adjustment	1123	1123	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.694965
2848	3	3	2212	51	Adjustment	493	493	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.69792
2849	3	3	2213	51	Adjustment	64	64	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.700471
2850	3	3	2214	51	Adjustment	1212	1212	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.702823
2851	3	3	2215	51	Adjustment	523	523	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.705139
2852	3	3	2216	51	Adjustment	1246	1246	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.70745
2853	3	3	2217	51	Adjustment	526	526	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.70994
2854	3	3	2218	51	Adjustment	908	908	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.712474
2855	3	3	2219	51	Adjustment	1334	1334	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.715334
2856	3	3	2220	51	Adjustment	797	797	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.717811
2857	3	3	2221	51	Adjustment	36	36	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.72015
2858	3	3	2222	51	Adjustment	260	260	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.722486
2859	3	3	2223	51	Adjustment	139	139	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.724837
2860	3	3	2224	51	Adjustment	186	186	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.727394
2861	3	3	2225	51	Adjustment	382	382	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.730122
2862	3	3	2226	51	Adjustment	172	172	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.732875
2863	3	3	2227	51	Adjustment	276	276	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.735264
2864	3	3	2228	51	Adjustment	242	242	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.737619
2865	3	3	2229	51	Adjustment	474	474	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.740062
2866	3	3	2230	51	Adjustment	162	162	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.742678
2867	3	3	2231	51	Adjustment	562	562	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.745173
2868	3	3	2232	51	Adjustment	310	310	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.74814
2869	3	3	2233	51	Adjustment	716	716	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.750686
2870	3	3	2234	51	Adjustment	1086	1086	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.753106
2871	3	3	2235	51	Adjustment	572	572	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.755441
2872	3	3	2236	51	Adjustment	352	352	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.75776
2873	3	3	2237	51	Adjustment	311	311	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.760244
2874	3	3	2238	51	Adjustment	690	690	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.762755
2875	3	3	2239	51	Adjustment	96	96	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.765684
2876	3	3	2240	51	Adjustment	229	229	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.768161
2877	3	3	2241	51	Adjustment	610	610	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.770504
2878	3	3	2242	51	Adjustment	287	287	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.77288
2879	3	3	2243	51	Adjustment	414	414	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.775241
2880	3	3	2244	51	Adjustment	946	946	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.777739
2881	3	3	2245	51	Adjustment	1399	1399	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.780607
2882	3	3	2246	51	Adjustment	18	18	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.783306
2883	3	3	2247	51	Adjustment	485	485	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.785679
2884	3	3	2248	51	Adjustment	143	143	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.788
2885	3	3	2249	51	Adjustment	110	110	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.790346
2886	3	3	2250	51	Adjustment	1102	1102	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.792833
2887	3	3	2251	51	Adjustment	1112	1112	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.795298
2888	3	3	2252	51	Adjustment	411	411	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.798275
2889	3	3	2253	51	Adjustment	892	892	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.800845
2890	3	3	2254	51	Adjustment	571	571	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.803222
2891	3	3	2255	51	Adjustment	686	686	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.80556
2892	3	3	2256	51	Adjustment	1058	1058	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.807895
2893	3	3	2257	51	Adjustment	763	763	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.810507
2894	3	3	2258	51	Adjustment	176	176	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.813145
2895	3	3	2259	51	Adjustment	385	385	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.816036
2896	3	3	2260	51	Adjustment	232	232	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.818474
2897	3	3	2261	51	Adjustment	725	725	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.820842
2898	3	3	2262	51	Adjustment	447	447	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.823294
2899	3	3	2263	51	Adjustment	745	745	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.825664
2900	3	3	2264	51	Adjustment	484	484	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.828117
2901	3	3	2265	51	Adjustment	126	126	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.830949
2902	3	3	2266	51	Adjustment	228	228	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.833635
2903	3	3	2267	51	Adjustment	688	688	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.836054
2904	3	3	2268	51	Adjustment	360	360	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.838405
2905	3	3	2269	51	Adjustment	320	320	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.840735
2906	3	3	2270	51	Adjustment	487	487	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.843126
2907	3	3	2271	51	Adjustment	165	165	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.845747
2908	3	3	2272	51	Adjustment	109	109	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.848617
2909	3	3	2273	51	Adjustment	644	644	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.851151
2910	3	3	2274	51	Adjustment	441	441	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.853576
2911	3	3	2275	51	Adjustment	678	678	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.855898
2912	3	3	2276	51	Adjustment	95	95	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.858219
2913	3	3	2277	51	Adjustment	1049	1049	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.860709
2914	3	3	2278	51	Adjustment	411	411	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.863342
2915	3	3	2279	51	Adjustment	175	175	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.866213
2916	3	3	2280	51	Adjustment	477	477	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.868642
2917	3	3	2281	51	Adjustment	707	707	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.871
2918	3	3	2282	51	Adjustment	892	892	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.873433
2919	3	3	2283	51	Adjustment	663	663	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.875764
2920	3	3	2284	51	Adjustment	193	193	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.878297
2921	3	3	2285	51	Adjustment	509	509	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.881254
2922	3	3	2286	51	Adjustment	161	161	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.883918
2923	3	3	2287	51	Adjustment	26	26	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.886321
2924	3	3	2288	51	Adjustment	360	360	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.888659
2925	3	3	2289	51	Adjustment	425	425	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.890996
2926	3	3	2290	51	Adjustment	25	25	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.893414
2927	3	3	2291	51	Adjustment	681	681	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.895981
2928	3	3	2292	51	Adjustment	457	457	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.898914
2929	3	3	2293	51	Adjustment	556	556	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.901467
2930	3	3	2294	51	Adjustment	158	158	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.90388
2931	3	3	2295	51	Adjustment	347	347	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.906223
2932	3	3	2296	51	Adjustment	779	779	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.908556
2933	3	3	2297	51	Adjustment	363	363	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.911226
2934	3	3	2298	51	Adjustment	428	428	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.91404
2935	3	3	2299	51	Adjustment	496	496	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.916845
2936	3	3	2300	51	Adjustment	42	42	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.919236
2937	3	3	2301	51	Adjustment	315	315	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.921567
2938	3	3	2302	51	Adjustment	208	208	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.923887
2939	3	3	2303	51	Adjustment	1196	1196	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.926223
2940	3	3	2304	51	Adjustment	472	472	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.928699
2941	3	3	2305	51	Adjustment	949	949	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.931619
2942	3	3	2306	51	Adjustment	645	645	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.934207
2943	3	3	2307	51	Adjustment	771	771	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.936577
2944	3	3	2308	51	Adjustment	430	430	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.938892
2945	3	3	2309	51	Adjustment	135	135	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.94122
2946	3	3	2310	51	Adjustment	51	51	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.943677
2947	3	3	2311	51	Adjustment	157	157	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.946173
2948	3	3	2312	51	Adjustment	174	174	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.949138
2949	3	3	2313	51	Adjustment	142	142	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.95174
2950	3	3	2314	51	Adjustment	69	69	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.954164
2951	3	3	2315	51	Adjustment	193	193	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.9565
2952	3	3	2316	51	Adjustment	600	600	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.95878
2953	3	3	2317	51	Adjustment	487	487	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.961254
2954	3	3	2318	51	Adjustment	19	19	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.963894
2955	3	3	2319	51	Adjustment	778	778	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.966795
2956	3	3	2320	51	Adjustment	75	75	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.969172
2957	3	3	2321	51	Adjustment	943	943	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.971529
2958	3	3	2322	51	Adjustment	826	826	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.973851
2959	3	3	2323	51	Adjustment	355	355	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.976221
2960	3	3	2324	51	Adjustment	290	290	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.978738
2961	3	3	2325	51	Adjustment	217	217	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.981587
2962	3	3	2326	51	Adjustment	556	556	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.984242
2963	3	3	2327	51	Adjustment	2	2	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.986729
2964	3	3	2328	51	Adjustment	545	545	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.989005
2965	3	3	2329	51	Adjustment	104	104	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.991333
2966	3	3	2330	51	Adjustment	558	558	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.993749
2967	3	3	2331	51	Adjustment	114	114	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.996268
2968	3	3	2332	51	Adjustment	146	146	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:56.999212
2969	3	3	2333	51	Adjustment	230	230	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:57.001772
2970	3	3	2334	51	Adjustment	486	486	Opening Balance	\N	OB-EXCEL	\N	\N	Initial seed from Excel upload	4	2026-06-03 12:31:57.003331
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
13	3	3	PAINTING	51	t	f
14	3	3	ELECTRICAL	52	t	f
15	3	3	GEN	53	t	f
16	3	3	HOSP EQPT	53	t	f
17	3	3	IT	53	t	f
18	3	3	BIOMEDICAL	54	t	f
19	3	3	CathLab	54	t	f
20	3	3	CSSD	54	t	f
21	3	3	Dental	54	t	f
22	3	3	DIALYSIS CENTRE	54	t	f
23	3	3	ELECTRICAL	54	t	f
24	3	3	EMD	54	t	f
25	3	3	EQPT	54	t	f
26	3	3	GEN	54	t	f
27	3	3	LINEN	54	t	f
28	3	3	OT	54	t	f
29	3	3	PHARMACY	54	t	f
30	3	3	RADIOLOGY	54	t	f
31	3	3	STATIONERY	54	t	f
32	3	3	LAB	54	t	f
33	3	3	LAB	55	t	f
34	3	3	GEN	56	t	f
35	3	3	HSK	56	t	f
36	3	3	IT	57	t	f
37	3	3	BIOCHEMISTRY	58	t	f
38	3	3	BLOOD BANK	58	t	f
39	3	3	GEN	58	t	f
40	3	3	HAEMATOLOGY	58	t	f
41	3	3	LAB	58	t	f
42	3	3	MICRO BIOLOGY	58	t	f
43	3	3	PATHOLOGY	58	t	f
44	3	3	STATIONERY	58	t	f
45	3	3	LINEN	59	t	f
46	3	3	PLUMBING	60	t	f
47	3	3	STATIONERY	61	t	f
48	3	3	BLOOD BANK	62	t	f
49	3	3	EMD	62	t	f
50	3	3	GEN	62	t	f
51	3	3	LAB	62	t	f
52	3	3	PHARMACY	62	t	f
53	3	3	STATIONERY	62	t	f
54	3	3	GEN	63	t	f
55	3	3	LAB	63	t	f
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
6	7	3	t	2026-06-01 10:43:26.011603
7	8	3	t	2026-06-01 10:46:37.254725
8	9	3	t	2026-06-01 10:47:27.258131
9	10	3	t	2026-06-01 10:48:25.010534
10	11	3	t	2026-06-01 10:50:02.223716
11	12	3	t	2026-06-01 11:17:37.748417
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
16	3	3	Kilometers	KM	t	f
17	3	3	Grams	GM	t	f
18	3	3	Millimeters	MM	t	f
19	3	3	Inches	INC	t	f
20	3	3	Feet	FT	t	f
15	3	3	Pairs	PRS	t	f
21	3	3	Can	CAN	t	f
22	3	3	Pocket	PKT	t	f
23	3	3	Pad	PAD	t	f
24	3	3	Meter	MTR	t	f
25	3	3	Bottle	BTL	t	f
27	3	3	Prs	PRS	t	f
\.


--
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_role_assignments (id, user_id, tenant_id, role_id, site_id, assigned_at) FROM stdin;
16	6	3	8	\N	2026-06-01 11:10:23.173255
17	7	3	7	\N	2026-06-01 11:10:27.978957
18	8	3	9	\N	2026-06-01 11:10:37.688588
23	5	3	4	\N	2026-06-01 11:15:04.062196
25	11	3	8	\N	2026-06-01 11:23:25.931221
34	10	3	5	\N	2026-06-01 16:11:46.859879
36	2	1	10	1	2026-06-01 19:19:41.540526
37	3	2	11	2	2026-06-01 19:19:41.548031
40	4	3	12	3	2026-06-01 19:22:37.287287
42	9	3	6	3	2026-06-02 10:24:27.231569
43	12	3	4	\N	2026-06-02 10:55:26.809897
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, full_name, hashed_password, is_active, is_platform_admin, is_deleted, created_at, updated_at, department) FROM stdin;
1	superadmin	super@nissigrid.com	Super Admin	$2b$12$kblQdcUjLM0OowBwpbo95.xFkdM32Nkb9QR0DBGPxXNddxi/Blswe	t	t	f	2026-05-15 10:36:51.375798	2026-05-15 10:36:51.375812	\N
2	admin	ilangkumaran@nissigrid.com	NG Admin	$2b$12$wGARVt2laadI2WThEO/ab.gugi7F4bDF.hZUUMbgE/CH.yUBBaBDK	t	f	f	2026-05-15 10:39:02.648701	2026-05-15 10:39:02.648715	\N
3	epadmin	ilangkumaran@yahoo.com	EastPoint Admin	$2b$12$jaHYZkPTGafulxVl1YbFqOteTo17KPzpCDcv9XA3X4643BF7pClA2	t	f	f	2026-05-15 10:52:51.952583	2026-05-15 10:52:51.952596	\N
6	grceo	fred@nissigrid.com	Fred	$2b$12$cQZpPfQTuq0uThZ5/DQfYOzN7ny5J78vH685hazc4Glxwt3KNV.62	t	f	f	2026-05-27 16:48:52.327279	2026-06-01 11:10:23.17203	ADMIN
7	Ram	ramraj@nissigrid.com	Ram Raj	$2b$12$zI/u28pu0mQorEvfoywzfeJ3vdP.7OzabYUCO4ycfOfbuOXbChOn6	t	f	f	2026-06-01 10:43:26.001745	2026-06-01 11:10:27.976737	CIVIL
8	Babu	babu@nissigrid.com	Babu Gate Keeper	$2b$12$AfyOt7p62NydDICchNNQi.z4klB/dreHJqgk7iT28DkUZxlwDAO5i	t	f	f	2026-06-01 10:46:37.253944	2026-06-01 11:10:37.687183	ADMIN
5	grmanager	samson@grinfra.com	Samson	$2b$12$JCmojQ2VPPUuJtRXVJQJlOVehitTNvWKnC3q7iXAt33.mslGPyYyG	t	f	f	2026-05-27 16:17:53.070455	2026-06-01 11:15:04.061678	CIVIL
12	Kumar	kumar@nissigrid.com	Kumar	$2b$12$UU7q1RYrVp8JsnfPos.16uwCv7FYvTvPk8ov9eyK4vdPq/rjRMTcO	t	f	f	2026-06-01 11:17:37.74726	2026-06-01 11:17:37.747272	\N
11	CEO	ceo@nissigrid.com	CEO Approver	$2b$12$OUaDYk53Ie59y677gzHxAuqS0bZIzBZ.KQihvUcHgygt46HxTUPeu	t	f	f	2026-06-01 10:50:02.222821	2026-06-01 11:23:25.929484	\N
10	Pandi	pandi@nissigrid.com	Pandiyarajan	$2b$12$cY7tnbCGuFqbAXVK4j6ZIeVb4ZJng8N6lEfxLzxd9Z05m7wRb2/tS	t	f	f	2026-06-01 10:48:25.009621	2026-06-01 16:11:46.857715	ADMIN
4	gradmin	fredrick.antony@nissigrid.com	Fredrick	$2b$12$OBqgozbEslPxZatqS3/21u32L1YguOUbTphKQJubs9ZmpyBFBQG7u	t	f	f	2026-05-15 12:07:07.024311	2026-06-01 19:22:37.285418	\N
9	Rajesh	rajesh@nissigrid.com	Rajesh G	$2b$12$ydhBXkSbrZ2eUXxgfuP2B.AF42aoTYfFDxZE/5dlKV8OxoY5Df2YO	t	f	f	2026-06-01 10:47:27.257166	2026-06-01 19:29:46.767544	CIVIL
\.


--
-- Data for Name: vendor_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_categories (id, vendor_id, category_id) FROM stdin;
41	51	41
42	52	43
45	55	49
46	56	45
47	57	46
48	58	45
50	60	43
53	54	47
55	59	41
56	53	41
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
1084	542	376	238	4500	15	f	
1085	543	376	238	40000	16	f	
1086	544	376	238	35000	7	f	
1087	545	376	238	35000	7	f	
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
542	185	53	CQ1	2026-06-04	2026-06-01	\N		Received	4	2026-06-01 17:25:37.763577
543	185	59	asds3455	2026-06-01	2026-06-01	\N		Received	4	2026-06-01 17:26:13.322436
544	185	54	g56	2026-06-01	2026-06-01	\N		Received	4	2026-06-01 17:26:36.577704
545	185	54	g56	2026-06-01	2026-06-01	\N		Received	4	2026-06-01 17:26:36.60883
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, tenant_id, site_id, name, code, contact_person, phone, email, gst_number, pan_number, address, city, state, pincode, bank_name, bank_account, ifsc_code, rating, is_active, is_deleted, created_at, updated_at) FROM stdin;
54	3	3	Asian Paints Ltd.	VEN-0004	Vijay Mallya	9876543213	vijay.mallya@asian.com	27ASIAN1234F1Z5	\N	6A, Shanti Nagar, Santacruz (East)	Mumbai	27 - Maharashtra	400055	\N	\N	\N	4.6	t	f	2026-05-15 15:19:36.628989	2026-06-02 17:02:56.145519
59	3	3	Dalmia Bharat Ltd.	VEN-0009	Arun Jaitley	9876543218	arun.jaitley@dalmia.com	29AALMA1234F1Z5	\N	11th & 12th Floor, Hansalaya Building, 15, Barakhamba Road	Bangalore	29 - Karnataka	560001	\N	\N	\N	4.5	t	f	2026-05-15 15:19:36.63549	2026-06-02 17:28:09.908722
53	3	3	ACC Limited	VEN-0003	Amit Shah	9876543212	amit.shah@acc.com	27ACCCC1234F1Z5	\N	Cement House, 121, Maharshi Karve Road, Bangalore - 560020, Karnataka	Bangalore	29 - Karnataka	560020	\N	\N	\N	4.7	t	f	2026-05-15 15:19:36.627527	2026-06-02 17:28:59.599208
51	3	3	UltraTech Cement Ltd.	VEN-0001	Rajesh Kumar	9876543210	rajesh.kumar@ultratech.com	29ULTRA1234F1Z5	\N	Ahura Centre, B-Wing, 2nd Floor, Mahakali Caves Road, Andheri (East), Mumbai - 400093	Bangalore	\N	\N	\N	\N	\N	4.8	t	f	2026-05-15 15:19:36.623721	2026-05-21 18:15:25.970621
52	3	3	Tata Steel Ltd.	VEN-0002	Sanjay Singh	9876543211	sanjay.singh@tata.com	29TATA1234F1Z5	\N	Bombay House, 24, Homi Mody Street, Fort, Mumbai - 400001	Bangalore	\N	\N	\N	\N	\N	4.9	t	f	2026-05-15 15:19:36.625324	2026-05-21 18:15:25.970634
55	3	3	Kajaria Ceramics Ltd.	VEN-0005	Ramesh Patel	9876543214	ramesh.patel@kajaria.com	29KAJAR1234F1Z5	\N	J1/B1 (Extn.), Mohan Co-op Industrial Estate, Mathura Road, New Delhi - 110044	Bangalore	\N	\N	\N	\N	\N	4.5	t	f	2026-05-15 15:19:36.630558	2026-05-21 18:15:25.970645
56	3	3	Hindware Home Innovation Ltd.	VEN-0006	Suresh Raina	9876543215	suresh.raina@hindware.com	29HIND1234F1Z5	\N	301-302, 3rd Floor, Park Centra, Sector-30, Gurugram - 122001	Bangalore	\N	\N	\N	\N	\N	4.4	t	f	2026-05-15 15:19:36.631833	2026-05-21 18:15:25.970648
57	3	3	Havells India Ltd.	VEN-0007	Deepak Chahar	9876543216	deepak.chahar@havells.com	29HAVEL1234F1Z5	\N	QRG Towers, 2D, Sector-126, Expressway, Noida - 201304	Bangalore	\N	\N	\N	\N	\N	4.8	t	f	2026-05-15 15:19:36.633077	2026-05-21 18:15:25.970651
58	3	3	Jaquar & Company Pvt Ltd.	VEN-0008	Pankaj Tripathi	9876543217	pankaj.tripathi@jaquar.com	29JAQU1234F1Z5	\N	Plot No. 3, Sector - 11, IMT Manesar, Gurugram - 122050	Bangalore	\N	\N	\N	\N	\N	4.7	t	f	2026-05-15 15:19:36.634253	2026-05-21 18:15:25.970654
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

SELECT pg_catalog.setval('public.alerts_id_seq', 2, true);


--
-- Name: approval_flows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approval_flows_id_seq', 3, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 102, true);


--
-- Name: buildings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buildings_id_seq', 4, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 63, true);


--
-- Name: company_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_addresses_id_seq', 3, true);


--
-- Name: current_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.current_stock_id_seq', 2644, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 259, true);


--
-- Name: document_sequences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_sequences_id_seq', 31, true);


--
-- Name: floors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.floors_id_seq', 22, true);


--
-- Name: gate_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gate_entries_id_seq', 189, true);


--
-- Name: gate_passes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gate_passes_id_seq', 2, true);


--
-- Name: grn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grn_id_seq', 198, true);


--
-- Name: grn_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grn_items_id_seq', 501, true);


--
-- Name: indent_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indent_approvals_id_seq', 2, true);


--
-- Name: indent_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indent_items_id_seq', 478, true);


--
-- Name: indents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.indents_id_seq', 205, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, true);


--
-- Name: material_issue_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_issue_items_id_seq', 189, true);


--
-- Name: material_issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_issues_id_seq', 212, true);


--
-- Name: material_return_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_return_items_id_seq', 7, true);


--
-- Name: material_returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_returns_id_seq', 16, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.materials_id_seq', 2334, true);


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

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 496, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 204, true);


--
-- Name: purchase_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_request_items_id_seq', 562, true);


--
-- Name: purchase_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_requests_id_seq', 188, true);


--
-- Name: quotation_comparisons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_comparisons_id_seq', 42, true);


--
-- Name: quotation_request_item_sources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_item_sources_id_seq', 16, true);


--
-- Name: quotation_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_items_id_seq', 376, true);


--
-- Name: quotation_request_prs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_prs_id_seq', 6, true);


--
-- Name: quotation_request_vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_request_vendors_id_seq', 376, true);


--
-- Name: quotation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_requests_id_seq', 185, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 530, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 12, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rooms_id_seq', 234, true);


--
-- Name: sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sites_id_seq', 3, true);


--
-- Name: stock_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_ledger_id_seq', 2970, true);


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

SELECT pg_catalog.setval('public.subcategories_id_seq', 55, true);


--
-- Name: tenant_memberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_memberships_id_seq', 11, true);


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

SELECT pg_catalog.setval('public.uom_id_seq', 27, true);


--
-- Name: user_role_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_role_assignments_id_seq', 43, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: vendor_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_categories_id_seq', 56, true);


--
-- Name: vendor_quotation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_quotation_items_id_seq', 1087, true);


--
-- Name: vendor_quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendor_quotations_id_seq', 545, true);


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
-- Name: company_addresses company_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses
    ADD CONSTRAINT company_addresses_pkey PRIMARY KEY (id);


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
-- Name: company_addresses uq_company_addr_per_site; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses
    ADD CONSTRAINT uq_company_addr_per_site UNIQUE (tenant_id, site_id, name, address_type);


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
-- Name: ix_company_addresses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_addresses_id ON public.company_addresses USING btree (id);


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
-- Name: ix_invoices_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_invoices_code ON public.invoices USING btree (code);


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
-- Name: ix_materials_reference_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_materials_reference_no ON public.materials USING btree (reference_no);


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
-- Name: company_addresses company_addresses_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses
    ADD CONSTRAINT company_addresses_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: company_addresses company_addresses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_addresses
    ADD CONSTRAINT company_addresses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


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
-- Name: invoices invoices_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.company_addresses(id);


--
-- Name: invoices invoices_consignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_consignee_id_fkey FOREIGN KEY (consignee_id) REFERENCES public.company_addresses(id);


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

\unrestrict YsEdpVHT7I9nDlHrMNHi3PVu1BGziaduLCsDXoZ8G6g5Neg6adhXvbl74m7Z3Ld

