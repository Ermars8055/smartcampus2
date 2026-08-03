using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities
{
    [Table("gate_entries")]
    public class GateEntry
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("tenant_id")]
        public int TenantId { get; set; }

        [Column("site_id")]
        public int SiteId { get; set; }

        [Column("entry_number")]
        public string EntryNumber { get; set; } = string.Empty;

        [Column("vehicle_number")]
        public string? VehicleNumber { get; set; }

        [Column("vendor_id")]
        public int? VendorId { get; set; }

        [Column("po_id")]
        public int? PoId { get; set; }

        [Column("project_id")]
        public int? ProjectId { get; set; }

        [Column("material_id")]
        public int? MaterialId { get; set; }

        [Column("quantity")]
        public double? Quantity { get; set; }

        [Column("arrival_time")]
        public DateTime ArrivalTime { get; set; } = DateTime.UtcNow;

        [Column("driver_name")]
        public string? DriverName { get; set; }

        [Column("driver_phone")]
        public string? DriverPhone { get; set; }

        [Column("delivery_person_name")]
        public string? DeliveryPersonName { get; set; }

        [Column("entry_type")]
        public string? EntryType { get; set; } = "Vehicle";

        [Column("photo_url")]
        public string? PhotoUrl { get; set; }

        [Column("invoice_scan_url")]
        public string? InvoiceScanUrl { get; set; }

        [Column("invoice_number")]
        public string? InvoiceNumber { get; set; }

        [Column("invoice_date")]
        public DateTime? InvoiceDate { get; set; }

        [Column("invoice_amount")]
        public double? InvoiceAmount { get; set; }

        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("status")]
        public string? Status { get; set; } = "Awaiting GRN";

        [Column("recorded_by_id")]
        public int RecordedById { get; set; }

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
