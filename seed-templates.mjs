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
        (name, company_name, address, phone, email, subject_prefix, terms)
      VALUES
        (
          ${tpl.name},
          ${tpl.company_name},
          ${tpl.address},
          ${tpl.phone},
          ${tpl.email},
          ${tpl.subject_prefix},
          ${tpl.terms}
        )
      RETURNING *
    `;
    console.log(`✅ Inserted: ${tpl.name} (id: ${inserted[0].id})`);
  }
}
