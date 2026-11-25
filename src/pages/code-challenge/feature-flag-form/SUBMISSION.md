# สรุปงานส่ง Feature Flag Editor

Editor สำหรับสร้างและตรวจสอบ Feature Flag พร้อมส่งออกเป็นไฟล์ `.goff.json` สำหรับ GO Feature Flag [โจทย์และเกณฑ์ประเมิน](./README.md)

## สิ่งที่ทำตามเกณฑ์

| เกณฑ์                          | สิ่งที่ทำและตรวจสอบ                                                                                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature Flag Logic & Targeting | ตั้งชื่อ Flag คำอธิบาย และสถานะ Enabled/Disabled เพิ่มและลบ Variation ที่มีชนิดข้อมูลชัดเจน สร้าง Targeting Rule ที่ซ้อน Group แบบ AND/OR ได้ สร้าง User Group และ Role เพื่อใช้ซ้ำ และกำหนด Role ให้ Group ได้ รองรับ Default Rule และ percentage rollout                      |
| State Management & Validation  | ใช้ `@tanstack/react-form` จัดการฟอร์มและ Array Fields ใช้ subscription เฉพาะส่วนที่ต้องอัปเดต และใช้ Zod ตรวจข้อมูลรวมถึงเงื่อนไขซ้อน แจ้ง error รายช่อง เช่น ชื่อ Flag ว่าง ชื่อซ้ำ หรืออ้างอิง Variation, Group หรือ Role ที่ถูกลบ พร้อมระงับการส่งออกระหว่างที่ข้อมูลยังผิด |
| Project Structure              | [your-codes/index.tsx](./your-codes/index.tsx) ประกอบหน้า Editor และแยกส่วนแสดงผลออกจาก hooks, types, validation และ JSON serialization                                                                                                                                         |
| UI/UX & Output Accuracy        | ใช้ Tailwind CSS และ shadcn/ui รองรับ Light/Dark และแสดง JSON แบบสดด้วย Monaco มีปุ่มคัดลอกและดาวน์โหลด ลากจัดลำดับ Targeting Rules, เงื่อนไขหรือ Group ภายในกลุ่มเดียวกัน และ User Groups ได้ รองรับปุ่มขึ้นลงสำหรับคีย์บอร์ด                                                  |

Role และ Group ใช้สำหรับการกำหนดกลุ่มเป้าหมายของ Flag แอปที่นำไฟล์ไปใช้เป็นผู้ส่งข้อมูลผู้ใช้ผ่าน evaluation context ตัวอย่าง context และรายละเอียดทางเทคนิคอยู่ใน [NOTES.md](./NOTES.md)

## วิธีรันและทดลอง

ทดสอบการติดตั้งจากสำเนาที่ไม่มี `node_modules` บน Node.js 22 และ pnpm 11 แล้ว คำสั่งต่อไปนี้รันจากโฟลเดอร์หลักของ repo

```bash
pnpm install --frozen-lockfile
pnpm dev
```

เปิด [Feature Flag Editor](http://localhost:3000/code-challenge/feature-flag-form#feature-flag-editor) แล้วลองตามลำดับนี้

1. เปลี่ยนชื่อ Flag คำอธิบาย หรือสถานะ แล้วดู JSON Preview อัปเดต ตั้งชื่อให้ว่างเพื่อดูว่า Zod แสดง error และปิดปุ่มดาวน์โหลด
2. เพิ่ม Variation แล้วลองอ้างอิงจาก Default Rule สร้าง User Group และกำหนด Role จากนั้นเลือกกลุ่มใน Targeting Rule แบบ AND/OR ซ้อนกัน
3. ลาก Targeting Rule เพื่อเปลี่ยนลำดับการประเมิน แล้วคัดลอกหรือดาวน์โหลด JSON

## ผลการตรวจสอบ

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` และ `pnpm build` ผ่านจากสำเนาที่ติดตั้งใหม่ โดย Vitest ผ่าน 8 เคส
- ทดสอบใน Chrome ทั้งเดสก์ท็อปและโหมดจำลองมือถือ ครอบคลุมฟอร์ม, Drag & Drop, validation และ JSON export
- ตรวจไฟล์ที่ดาวน์โหลดด้วย GO Feature Flag CLI และยืนยันทั้งกรณี Targeting Rule ตรงเงื่อนไขและกรณีใช้ Default Rule

## เช็กลิสต์ก่อนส่ง

- [x] รวมคู่มือส่งงาน การตั้งค่า pnpm และ lockfile ล่าสุดในชุดส่งงาน
- [ ] ส่งลิงก์ [besterdev/swift-dynamics-frontend](https://github.com/besterdev/swift-dynamics-frontend) ทางอีเมลตามที่โจทย์ระบุ
