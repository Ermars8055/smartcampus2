# SmartCampus v2 — Structured Application Workflows (Infographic Data)

This document contains the structured data required to generate end-to-end lifecycle infographics for every module in the system based exactly on the functional frontend actions.

---

## 1. INDENT LIFECYCLE
**Subtitle:** End-to-end flow of internal Material Requests from creation to fulfillment

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Created by Requester)
- `Draft` ➔ **Submit** ➔ `Awaiting Approval`
- `Awaiting Approval` ➔ **Approve** ➔ `Approved`
- `Awaiting Approval` ➔ **Reject** ➔ `Rejected`
- `Rejected` ➔ **Revise** ➔ `Draft` (Loopback)
- `Approved` ➔ **Warehouse Issues Stock** ➔ `Partially Issued` / `Issued`
- `Approved` ➔ **Procurement Converts** ➔ `Converted to PO`
- **Side Path (Cancelled):** From `Draft` / `Awaiting Approval` ➔ **Cancel** ➔ `Cancelled`

### Legend (State Definitions)
1. **Draft:** Created by Requester but not yet submitted.
2. **Awaiting Approval:** Submitted and awaiting review by the HOD or Approver.
3. **Approved:** Authorized for issue from the warehouse.
4. **Rejected:** Denied by the Approver.
5. **Partially Issued / Issued:** Material has been partially or fully issued by the warehouse.
6. **Converted to PO:** Sourced externally via Procurement.
7. **Cancelled:** Request was cancelled by the user before approval.

### Key Notes
- Cancellation is allowed only before the Indent is approved.
- Rejected Indents can be revised and resubmitted as Drafts.
- Indents for items not in stock are converted directly to Purchase Orders.

---

## 2. PURCHASE REQUEST (PR) LIFECYCLE
**Subtitle:** End-to-end flow of Purchase Request from creation to closure

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Created by User)
- `Draft` ➔ **Submit** ➔ `Submitted`
- `Submitted` ➔ **Approve** ➔ `Approved`
- `Submitted` ➔ **Reject** ➔ `Rejected`
- `Rejected` ➔ **Revise** ➔ `Draft` (Loopback)
- `Approved` ➔ **Buyer Converts** ➔ `Converted to PO`
- `Approved` ➔ **Buyer Short Closes** ➔ `Short Closed`
- **Side Path (Cancelled):** From `Draft` / `Submitted` ➔ **Cancel** ➔ `Cancelled`

### Legend (State Definitions)
1. **Draft:** Created by Requester but not yet submitted.
2. **Submitted:** Requester submits for approval.
3. **Approved:** Authorized by the Approver.
4. **Rejected:** Denied by the Approver.
5. **Converted to PO:** PR is linked and converted into a Purchase Order.
6. **Cancelled:** Cancelled before approval.
7. **Short Closed:** Manually closed by the buyer after approval (e.g., no longer needed).

### Key Notes
- Cancellation is allowed only in Draft or Submitted states.
- A single PR can be converted into one or more Purchase Orders.
- Short Close is used when an Approved PR will not be fully converted.

---

## 3. PURCHASE ORDER (PO) LIFECYCLE
**Subtitle:** End-to-end flow of Purchase Order from creation to closure

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Created from PR/QR)
- `Draft` ➔ **Submit** ➔ `Submitted`
- `Submitted` ➔ **Approve** ➔ `Approved`
- `Submitted` ➔ **Reject** ➔ `Rejected`
- `Rejected` ➔ **Revise** ➔ `Draft` (Loopback)
- `Approved` ➔ **Send** ➔ `Sent to Vendor`
- `Sent to Vendor` ➔ **Partial GRN** ➔ `Partially Received`
- `Partially Received` ➔ **Final GRN** ➔ `Closed`
- **Side Path (Cancelled):** From `Draft` / `Submitted` ➔ **Cancel** ➔ `Cancelled`
- **Side Path (Short Closed):** From `Approved` / `Sent to Vendor` / `Partially Received` ➔ **Short Close** ➔ `Short Closed`

### Legend (State Definitions)
1. **Draft:** Created from PR/QR.
2. **Submitted:** Buyer submits.
3. **Approved:** Approver approves.
4. **Rejected:** Approver rejects.
5. **Sent to Vendor:** PO dispatched via email.
6. **Partially Received:** GRN posted, open qty remains.
7. **Closed:** Final GRN posted, qty = 0.
8. **Cancelled:** Cancelled before approval.
9. **Short Closed:** Manually closed by buyer before full receipt.

### Key Notes
- Cancellation is allowed only before approval.
- PO moves to Partially Received when goods are received partially via GRN.
- PO is Closed automatically only when the open quantity reaches zero.
- Short Close is used to terminate a PO manually if the vendor cannot fulfill the remaining quantity.

---

## 4. QUOTATION REQUEST (QR) LIFECYCLE
**Subtitle:** End-to-end flow of vendor sourcing and quotation comparison

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Buyer creates QR)
- `Draft` ➔ **Send to Vendors** ➔ `Requested`
- `Requested` ➔ **Start Receiving** ➔ `Received`
- `Received` ➔ **Save Quotes** ➔ `Entered`
- `Entered` ➔ **System Auto-Compares** ➔ `Compared`
- `Compared` ➔ **Approve** ➔ `Approved`
- `Approved` ➔ **Convert to PO** ➔ `Ordered`

### Legend (State Definitions)
1. **Draft:** QR created but not sent.
2. **Requested:** Sent to Vendors for pricing.
3. **Received:** Buyer begins receiving quotes.
4. **Entered:** Quotes are entered into the system.
5. **Compared:** System completes comparative rate analysis.
6. **Approved:** Approver selects and approves the best vendor quote.
7. **Ordered:** Converted into a final Purchase Order.

### Key Notes
- The system automatically transitions to 'Compared' once all entered quotes are saved.
- Only an Approved quote can be converted to a PO.

---

## 5. GATE ENTRY (INWARD) LIFECYCLE
**Subtitle:** Flow of inbound vehicles and deliveries at the facility gate

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Awaiting GRN` (Security logs delivery)
- `Awaiting GRN` ➔ **Warehouse Completes GRN** ➔ `Completed`

### Legend (State Definitions)
1. **Awaiting GRN:** Delivery is logged at the gate and awaits warehouse inspection.
2. **Completed:** Warehouse has posted a GRN against this entry.

### Key Notes
- Gate Entry records cannot be deleted once created; they remain 'Awaiting GRN' until actioned.
- A single Gate Entry is mapped to a single GRN.

---

## 6. GOODS RECEIPT NOTE (GRN) LIFECYCLE
**Subtitle:** Flow of material inspection and inventory intake

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Warehouse creates GRN)
- `Draft` ➔ **Submit** ➔ `Completed`

### Legend (State Definitions)
1. **Draft:** GRN is being verified against PO and physical goods.
2. **Completed:** Accepted quantities are confirmed and added to inventory.

### Key Notes
- Submitting a GRN automatically updates the corresponding PO's received quantity.
- Stock ledger is updated instantly upon GRN completion.

---

## 7. MATERIAL ISSUE LIFECYCLE
**Subtitle:** Flow of issuing inventory to internal departments or technicians

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Warehouse initiates issue)
- `Draft` ➔ **Submit Issue** ➔ `Issued`

### Legend (State Definitions)
1. **Draft:** Issue transaction is being prepared.
2. **Issued:** Materials are deducted from inventory and handed over.

### Key Notes
- Directly deducts from 'Current Stock' in the warehouse.
- Issues can be linked to Indents or Maintenance Complaints.

---

## 8. MATERIAL RETURN LIFECYCLE
**Subtitle:** Flow of returning unused or damaged materials back to the warehouse

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Initiated` (User initiates return)
- `Initiated` ➔ **Warehouse Inspects & Receives** ➔ `Usable` / `Damaged`

### Legend (State Definitions)
1. **Initiated:** Department or technician requests a return.
2. **Usable:** Material passes inspection and returns to usable inventory.
3. **Damaged:** Material fails inspection and is kept separate for write-off/scrap.

### Key Notes
- Returns require physical inspection by the warehouse before stock levels are updated.

---

## 9. STOCK TRANSFER LIFECYCLE
**Subtitle:** Flow of moving inventory between different warehouses

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Initiated` (Source warehouse dispatches)
- `Initiated` ➔ **Destination Receives** ➔ `Partially Received` / `Completed`

### Legend (State Definitions)
1. **Initiated:** Stock is deducted from the source warehouse and is in transit.
2. **Partially Received:** Destination accepts a partial quantity.
3. **Completed:** Destination accepts the full quantity; stock is added to destination warehouse.

### Key Notes
- Stock remains in an intermediate ledger state while initiated to prevent inventory mismatch.

---

## 10. GATE PASS (OUTWARD) LIFECYCLE
**Subtitle:** Flow of tracking materials leaving the premises

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Issued` (User submits Gate Pass)

### Legend (State Definitions)
1. **Issued:** Material is authorized to leave the premises.

### Key Notes
- Gate Passes are used for Repair, Return to Vendor, or Scrap.

---

## 11. COMPLAINTS (HELPDESK) LIFECYCLE
**Subtitle:** End-to-end flow of facility maintenance complaints

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Registered` (Requester logs complaint)
- `Registered` ➔ **Assign** ➔ `Assigned`
- `Assigned` ➔ **Inspect** ➔ `Under Inspection` (If no material needed)
- `Assigned` ➔ **Inspect (Requires Material)** ➔ `Material Pending`
- `Material Pending` / `Under Inspection` ➔ **Start Repair** ➔ `In Progress`
- `In Progress` / `Material Pending` ➔ **Resolve** ➔ `Closed`

### Legend (State Definitions)
1. **Registered:** Complaint logged by user.
2. **Assigned:** Admin assigns a technician.
3. **Under Inspection:** Technician is evaluating the issue.
4. **Material Pending:** Parts are required from the warehouse.
5. **In Progress:** Repair work is actively happening.
6. **Closed:** Technician resolves and closes the ticket.

### Key Notes
- Technicians close the ticket directly upon resolution.
- Material requests from complaints automatically trigger Material Issue workflows in the warehouse.

---

## 12. INVOICE LIFECYCLE
**Subtitle:** Flow of invoice registration, matching, and payment

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (Finance registers invoice)
- `Draft` ➔ **Submit** ➔ `Submitted`
- `Submitted` ➔ **Change Required** ➔ `Change Required` (Mismatch found)
- `Change Required` ➔ **Revise** ➔ `Submitted` (Loopback)
- `Submitted` ➔ **Approve** ➔ `Approved`
- `Approved` ➔ **Schedule Payment** ➔ `Sent for Payment`
- `Sent for Payment` ➔ **Process Payment** ➔ `Paid`

### Legend (State Definitions)
1. **Draft:** Invoice is registered in the system.
2. **Submitted:** Sent for 3-way matching (PO vs GRN vs Invoice).
3. **Change Required:** Discrepancy found, requires revision.
4. **Approved:** 3-way match successful; ready for payment.
5. **Sent for Payment:** Payment is scheduled.
6. **Paid:** Payment executed and recorded.

### Key Notes
- Approval requires a successful 3-way match.
- Invoices can be matched against single or multiple GRNs.

---

## 13. INVENTORY WRITE-OFFS LIFECYCLE
**Subtitle:** Flow of writing off damaged, expired, or lost inventory

### Flow (Nodes & Edge Triggers)
- **START** ➔ `Draft` (User creates Write-Off)
- `Draft` ➔ **Submit** ➔ `Submitted`
- `Submitted` ➔ **Approve** ➔ `Approved`
- `Submitted` ➔ **Reject** ➔ `Rejected`
- `Rejected` ➔ **Revise** ➔ `Draft` (Loopback)

### Legend (State Definitions)
1. **Draft:** Write-off recorded but not yet submitted.
2. **Submitted:** Sent for approval.
3. **Approved:** Inventory is officially reduced from the ledger.
4. **Rejected:** Write-off request denied.

### Key Notes
- Approved write-offs permanently reduce inventory without requiring a physical Gate Pass.
- Used for obsolescence, damage, or expiry.
