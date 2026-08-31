export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/verify") {
      const name = (url.searchParams.get("name") || "").trim();
      const date = (url.searchParams.get("date") || "").trim();

      if (!name || !date) {
        return api({ verified:false, message:"Please enter your name and issue date." }, 400);
      }

      const baseId = env.AIRTABLE_BASE_ID;
      const token = env.AIRTABLE_TOKEN;
      const tableName = env.AIRTABLE_TABLE_NAME || "Table 1";
      const nameField = env.AIRTABLE_NAME_FIELD || "Your Name";
      const dateField = env.AIRTABLE_DATE_FIELD || "Date";
      const statusField = env.AIRTABLE_STATUS_FIELD || "Status";
      const certificateField = env.AIRTABLE_CERTIFICATE_FIELD || "Certificate";

      if (!baseId || !token) {
        return api({ verified:false, message:"Database is not configured yet." }, 500);
      }

      try {
        const safeName = name.replace(/'/g, "\\'");
        const formula = `AND(LOWER({${nameField}})=LOWER('${safeName}'),DATETIME_FORMAT({${dateField}},'YYYY-MM-DD')='${date}')`;

        const airtableURL =
          `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}` +
          `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

        const r = await fetch(airtableURL, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!r.ok) {
          return api({ verified:false, message:"Unable to connect to the certificate database." }, 502);
        }

        const data = await r.json();
        const record = data.records?.[0];

        if (!record) {
          return api({ verified:false, message:"No verified certificate matches the provided information." });
        }

        const f = record.fields || {};
        let certificateURL = null;
        const cert = f[certificateField];

        if (Array.isArray(cert) && cert[0]?.url) certificateURL = cert[0].url;
        else if (typeof cert === "string" && cert.startsWith("http")) certificateURL = cert;

        return api({
          verified:true,
          name:f[nameField] || name,
          date:f[dateField] || date,
          status:f[statusField] || "Verified",
          certificateURL
        });
      } catch (e) {
        return api({ verified:false, message:"Verification service error." }, 500);
      }
    }

    return new Response(html, {
      headers: { "content-type":"text/html;charset=UTF-8", "cache-control":"no-store" }
    });
  }
};

function api(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type":"application/json;charset=UTF-8", "cache-control":"no-store" }
  });
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nakshatra Certificate Verification</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:24px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at top,#fffdf8,#f2ece2);color:#251b17;font-family:Georgia,"Times New Roman",serif}.card{width:100%;max-width:640px;padding:48px 36px;text-align:center;background:#fffdfa;border:1px solid #d9c7ae;box-shadow:0 20px 60px rgba(61,40,20,.15)}.brand{font:700 13px Arial,sans-serif;letter-spacing:3px;color:#7b1f2a;margin-bottom:12px}h1{font-size:32px;margin:8px 0 12px;color:#4a1118}.sub{font:14px/1.7 Arial,sans-serif;color:#6f6258;margin:0 0 34px}.group{text-align:left;margin:18px 0}label{display:block;font:700 13px Arial,sans-serif;margin-bottom:8px;color:#4b3a30}input{width:100%;padding:15px;border:1px solid #cdb99d;background:#fffdfa;font-size:16px}button{width:100%;margin-top:8px;padding:16px;border:0;background:#66151f;color:#fff;font-weight:700;font-size:15px;cursor:pointer}button:disabled{opacity:.65}.result{display:none;margin-top:28px;padding:24px;border:1px solid #d7c6ac}.ok{background:#f3faf4;border-color:#9fc6a4}.bad{background:#fff6f4;border-color:#d7aaa3}.icon{font-size:42px}.ok .icon{color:#23834a}.bad .icon{color:#9c2f24}.title{font-size:23px;margin:8px 0 12px}.details{font:14px/1.9 Arial,sans-serif;color:#51463f}.download{display:inline-block;margin-top:18px;padding:14px 20px;background:#23834a;color:#fff;text-decoration:none;font:700 14px Arial,sans-serif}.footer{margin-top:34px;font:11px/1.7 Arial,sans-serif;letter-spacing:.5px;color:#96887c}@media(max-width:520px){body{padding:15px}.card{padding:38px 22px}h1{font-size:27px}}
</style>
</head>
<body>
<main class="card">
<div class="brand">NAKSHATRA MAGAZINE & PUBLISHERS</div>
<h1>Certificate Verification</h1>
<p class="sub">Verify the authenticity of your official Nakshatra certificate using the recipient name and certificate issue date.</p>
<div class="group"><label>Your Name</label><input id="name" type="text" placeholder="Enter your full name"></div>
<div class="group"><label>Issue Date</label><input id="date" type="date"></div>
<button id="verify">VERIFY CERTIFICATE</button>
<div id="result" class="result"></div>
<div class="footer">OFFICIAL CERTIFICATE VERIFICATION PORTAL<br>NAKSHATRA MAGAZINE & PUBLISHERS</div>
</main>
<script>
const b=document.getElementById("verify"),out=document.getElementById("result");
b.onclick=async()=>{
 const name=document.getElementById("name").value.trim(),date=document.getElementById("date").value;
 if(!name||!date){show(false,"Please enter both Name and Issue Date.");return}
 b.disabled=true;b.textContent="VERIFYING...";out.style.display="block";out.className="result";out.innerHTML="<div class=details>Checking official certificate database...</div>";
 try{
  const r=await fetch("/verify?name="+encodeURIComponent(name)+"&date="+encodeURIComponent(date));
  const d=await r.json();
  if(d.verified){
   out.className="result ok";
   out.innerHTML='<div class=icon>✓</div><div class=title>Certificate Verified</div><div class=details><strong>Name:</strong> '+esc(d.name)+'<br><strong>Issue Date:</strong> '+esc(d.date)+'<br><strong>Status:</strong> '+esc(d.status)+'</div>'+(d.certificateURL?'<a class=download target=_blank rel=noopener href="'+attr(d.certificateURL)+'">DOWNLOAD CERTIFICATE</a>':'');
  }else show(false,d.message||"No verified certificate matches the provided information.");
 }catch(e){show(false,"Unable to connect to the verification service.");}
 finally{b.disabled=false;b.textContent="VERIFY CERTIFICATE";}
};
function show(ok,msg){out.style.display="block";out.className="result "+(ok?"ok":"bad");out.innerHTML='<div class=icon>'+ (ok?"✓":"✕")+'</div><div class=title>'+ (ok?"Certificate Verified":"Certificate Not Found")+'</div><div class=details>'+esc(msg)+'</div>'}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function attr(v){return esc(v)}
</script>
</body></html>`;
