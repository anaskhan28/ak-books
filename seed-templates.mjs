import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  config();
}

const sql = neon(process.env.DATABASE_URL);

const templates = [
  {
    name: "Vedant Enterprises",
    company_name: "Vedant Enterprises",
    address:
      "Shop No. 5, Om Siddheshwar Apartment, Surya Nagar, Gate No. 1, Vitawa, Thane (E) 400 605",
    phone: "9920166814",
    email: "vedantenterprises2016@gmail.com",
    subject_prefix: "Sub:",
    terms:
      "1. Authorized work group\n2. GST 18% Extra\n3. Payment 100% Against Work Done .\n4. Warai /Mathadi & Any other Local Charges Extra",
  },
  {
    name: "Energy Security",
    company_name: "Energy Security & Office Automation",
    address:
      "6, Vrindavan Chs, B Wing, Sector 9, Khanda Colony, Navi Mumbai 410206",
    phone: "9920428812",
    email: "",
    subject_prefix: "Sub:",
    terms:
      "1. GST@18%Extra\n2. PAYMENT: 100% Advance\n3. Work Done in 2-3 Weeks\n4. Warai/ Mathadi & Any Other Local Charges Extra",
  },
  {
    name: "Vijay Enterprises",
    company_name: "Vijay Enterprises",
    address:
      "Mahalaxmi Vaibhav Apt., B-10, 3rd Floor, Near 'F' Cabin, Kalyan (E).",
    phone: "9920428812",
    email: "",
    subject_prefix: "Subject:",
    terms: "",
  },
  {
    name: "AK Enterprises",
    company_name: "AK Enterprises",
    address:
      "Shop no 13 opposite Omkaleshwar Mandir, near Daighar Police Station, Thane, Maharashtra 400612",
    phone: "9892493707",
    email: "akenterprises.dealers@gmail.com",
    subject_prefix: "Subject :",
    terms:
      "1. Authorized work group\n2. GST 18% Extra\n3. Payment 100% Against Work Done .\n4. Warai /Mathadi & Any other Local Charges Extra",
    layout_preset: "ak-enterprises",
  },
  {
    name: "Axiom Spaceworks",
    company_name: "Axiom Spaceworks",
    address:
      "Shop No. 35, Star Market, Phase 2, Opp. New Ekta Weigh Bridge, Dahisar, Thane – 400612",
    phone: "+91 89289 63329",
    email: "businessesaxiom@gmail.com",
    subject_prefix: "QT-AXM",
    invoice_prefix: "INV-AXM",
    terms:
      "1. Quotation valid for 15 days.\n2. GST extra as applicable.\n3. 100% payment upon completion, unless agreed otherwise.\n4. Additional work beyond the quoted scope will be charged extra.",
    header_image:
      "https://res.cloudinary.com/anaskhan/image/upload/v1788841702/templates/axiom_spaceworks_fwxj2z.png",
    signature_image:
      "https://res.cloudinary.com/anaskhan/image/upload/v1788841778/templates/axiom_businesses_ig0vp0.png",
    primary_color: "#8a004c",
    layout_preset: "axiom",
  },
];

for (const tpl of templates) {
  const existing = await sql`
    SELECT id, name FROM quotation_templates
    WHERE lower(name) = ${tpl.name.toLowerCase()}
  `;

  if (existing.length > 0) {
    console.log(`✓ Already exists: ${tpl.name} (id: ${existing[0].id})`);
  } else {
    const inserted = await sql`
      INSERT INTO quotation_templates
        (name, company_name, address, phone, email, subject_prefix, invoice_prefix, terms, header_image, signature_image, primary_color, layout_preset)
      VALUES
        (
          ${tpl.name},
          ${tpl.company_name},
          ${tpl.address},
          ${tpl.phone},
          ${tpl.email},
          ${tpl.subject_prefix},
          ${tpl.invoice_prefix || 'INV-'},
          ${tpl.terms},
          ${tpl.header_image || null},
          ${tpl.signature_image || null},
          ${tpl.primary_color || null},
          ${tpl.layout_preset || null}
        )
      RETURNING *
    `;
    console.log(`✅ Inserted: ${tpl.name} (id: ${inserted[0].id})`);
  }
}
