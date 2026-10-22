# ซอร์ส การติดตั้ง และการตรวจสอบ

<!-- language-navigation:start -->
<p dir="ltr">
<a href="Process-and-Results.md" lang="en" dir="ltr">English</a>
<a href="Process-and-Results.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="Process-and-Results.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="Process-and-Results.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="Process-and-Results.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="Process-and-Results.es.md" lang="es" dir="ltr">Español</a>
<a href="Process-and-Results.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="Process-and-Results.fr.md" lang="fr" dir="ltr">Français</a>
<a href="Process-and-Results.he.md" lang="he" dir="rtl">עברית</a>
<a href="Process-and-Results.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="Process-and-Results.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="Process-and-Results.it.md" lang="it" dir="ltr">Italiano</a>
<a href="Process-and-Results.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="Process-and-Results.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="Process-and-Results.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="Process-and-Results.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="Process-and-Results.pt.md" lang="pt" dir="ltr">Português</a>
<a href="Process-and-Results.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="Process-and-Results.th.md" lang="th" dir="ltr">ไทย</a>
<a href="Process-and-Results.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="Process-and-Results.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="Process-and-Results.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="Process-and-Results.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="Process-and-Results.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[หน้าหลักวิกิ](Home.md)

รีโพซิทอรีสาธารณะ `speeddial` เก็บแอปทั้งสองรุ่น การทดสอบ ตัวอย่างการติดตั้งทั่วไป และเอกสาร โดยเริ่มด้วยประวัติ Git ใหม่และข้อมูลทดสอบสังเคราะห์ คลังงานปฏิบัติการส่วนตัวเก็บข้อมูลย้อนหลังและบันทึกการกู้คืนการติดตั้ง ใช้ซอร์สสาธารณะที่ตรึงรุ่นหรืออิมเมจที่แก้ไขไม่ได้ โดยไม่ทำสำเนาโค้ดแอป

[แอปที่เก็บข้อมูลในเบราว์เซอร์](https://speeddial.alvit.here.now/) เริ่มผู้เยี่ยมชมแต่ละคนด้วยบอร์ดว่าง การเผยแพร่โค้ดไม่คัดลอกลิงก์หรือภาพหน้าจอของใครไปยังเบราว์เซอร์อื่น [สคริปต์สำรองข้อมูล](../docs/browser-backups.th.md) แนะนำการย้ายโดยตั้งใจ พร้อมสำเนากู้ภัยของปลายทางและการเปรียบเทียบเนื้อหาอย่างแม่นยำหลังกู้คืน

## กระบวนการติดตั้ง

![การตรวจสอบซอร์ส การซ้อมกู้คืนในสภาพแวดล้อมแยก การติดตั้ง และการตรวจรับ เป็นคนละขั้นตอน](images/release-process.svg)

รุ่นเซิร์ฟเวอร์ยังรองรับ Node.js, Docker และ k3s ตรึงรุ่นสาธารณะ สร้างหรือเลือกอิมเมจที่แก้ไขไม่ได้ซึ่งตรวจสอบแล้ว และใช้การตั้งค่าส่วนตัวนอกรีโพซิทอรีนี้ แยกข้อมูลรับรองและโวลุ่มข้อมูลถาวรออกจากอิมเมจแอป ใช้[คู่มือเปลี่ยนระบบและย้อนกลับ](../deploy/README.md) เมื่อต้องย้ายการติดตั้งเดิม

## ขอบเขตรีโพซิทอรีและข้อมูล

![ซอร์สแอปสาธารณะใช้กับการติดตั้งส่วนตัว ข้อมูลเบราว์เซอร์ส่วนบุคคลและบันทึกการกู้คืนเซิร์ฟเวอร์ยังเป็นส่วนตัว](images/release-results.svg)

ซอร์สสาธารณะไม่มีบอร์ดเริ่มต้นส่วนบุคคล ข้อมูลสำรองเบราว์เซอร์ในเครื่องอยู่ใน `backups/` ที่ Git ละเว้น ชุดกู้คืนเซิร์ฟเวอร์ประกอบด้วย SQLite ไฟล์ภาพที่อ้างอิง และข้อมูลรับรองที่ป้องกันแยกต่างหาก รูปแบบเหล่านี้ใช้กับคนละรุ่นและใช้แทนกันไม่ได้

## การตรวจสอบ

การตรวจในเครื่องและ CI ตรวจสอบข้อมูลทดสอบสังเคราะห์และสถานการณ์ที่เรียกใช้ ทั้งสองรุ่นยังมีห้าภาษา ชุดควบคุมที่ย่อไว้ การสลับเป็นคู่ ตัวอย่างที่ตามตัวชี้ ขนาดตาราง และการนำทางในหน้าต่างเดิมเป็นค่าเริ่มต้น

การซ้อมย้ายเซิร์ฟเวอร์เปรียบเทียบ ID ลำดับ ชื่อเรื่อง URL การตั้งค่า การอ้างอิงภาพ และความสมบูรณ์ของ SQLite การตรวจหลังเปลี่ยนข้อมูลรับรองยืนยันว่าเซสชันเก่าใช้ไม่ได้หลังเริ่มระบบใหม่ การตรวจรับการติดตั้งจริงยังตรวจเส้นทางที่ต้องการ ข้อมูลรับรอง ความพร้อมของภาพ และการเก็บรักษาข้อมูลในสภาพแวดล้อมปลายทางด้วย

การตรวจซอร์สผ่านไม่ได้พิสูจน์ว่ามีการติดตั้งหรือกู้คืนแล้ว เก็บใบรับการติดตั้งจริงและรายการข้อมูลส่วนบุคคลไว้เป็นส่วนตัว แผนภาพอธิบายสถาปัตยกรรมและกระบวนการ ไม่ได้รับประกันประสิทธิภาพ ความพร้อมใช้งาน หรือเวลากู้คืน ซอร์สสาธารณะยังคงเป็น `UNLICENSED`
