const Privacy = () => (
  <div className="bg-slate-50">
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Petskub Cookie Policy</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">นโยบายคุกกี้และความเป็นส่วนตัว</h1>
        <p className="text-base text-slate-600">
          เอกสารนี้อธิบายว่าพวกเราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อให้บริการชุมชนการช่วยเหลือสัตว์ได้อย่างปลอดภัยและโปร่งใส
        </p>
      </header>

      <section className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">1. คุกกี้ที่จำเป็น (Strictly Necessary)</h2>
          <p className="mt-3 text-sm text-slate-600">
            ใช้เพื่อให้ระบบพื้นฐานทำงาน เช่น จดจำสถานะการเข้าสู่ระบบ ป้องกันการปลอมแปลงคำขอ (CSRF) และโหลดการตั้งค่าภาษา/ธีมของคุณ ไม่มีคุกกี้ประเภทนี้ เท่ากับไม่สามารถใช้งานระบบสมาชิก หรือลงประกาศได้
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-slate-600">
            <li>ชื่อคุกกี้: <span className="font-mono text-slate-800">sb:session</span> – ใช้จดจำผู้ใช้ที่ล็อกอิน (หมดอายุ 7 วัน)</li>
            <li>ชื่อคุกกี้: <span className="font-mono text-slate-800">petskub:csrf</span> – ป้องกันการยิงคำสั่งข้ามโดเมน (หมดอายุ 2 ชั่วโมง)</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">2. คุกกี้เพื่อการทำงาน (Functional)</h2>
          <p className="mt-3 text-sm text-slate-600">
            ช่วยจดจำตัวเลือกเฉพาะของคุณ เช่น จังหวัดที่เลือกบ่อย การตั้งค่าแชท และสถานะการยอมรับคุกกี้ของเรา เพื่อลดการถามซ้ำและทำให้เว็บไซต์ตอบสนองเร็วขึ้น
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-slate-600">
            <li><span className="font-mono text-slate-800">petskub.filters</span> – เก็บค่าคัดกรองที่คุณใช้ในหน้ารับเลี้ยง (หมดอายุ 30 วัน)</li>
            <li><span className="font-mono text-slate-800">petskub.cookie-consent</span> – บันทึกวันที่ยอมรับคุกกี้ (หมดอายุ 12 เดือน)</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">3. คุกกี้เชิงสถิติ (Analytics)</h2>
          <p className="mt-3 text-sm text-slate-600">
            เราใช้ Plausible Analytics ที่ไม่ใช้คุกกี้โดยค่าเริ่มต้น หากมีการเปิดโหมดเก็บข้อมูลเพิ่มเติม ระบบจะสุ่มรหัสที่ไม่สามารถระบุตัวบุคคลได้เพื่อตรวจสอบว่าส่วนไหนของเว็บควรปรับปรุงเท่านั้น ไม่ขายข้อมูลผู้ใช้เด็ดขาด
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">4. วิธีจัดการหรือถอนความยินยอม</h2>
          <p className="mt-3 text-sm text-slate-600">
            คุณสามารถล้างคุกกี้ผ่านการตั้งค่าเบราว์เซอร์ หรือกดปุ่ม "ล้างการตั้งค่าคุกกี้" ด้านล่างเพื่อรีเซ็ตการยินยอมของ Petskub ได้ตลอดเวลา หลังจากรีเซ็ต เราจะแสดงป๊อปอัปอีกครั้งเมื่อคุณเข้าใช้งานหน้าใดก็ได้ในครั้งถัดไป
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof window === "undefined") {
                return;
              }

              try {
                window.localStorage.removeItem("petskub.cookie-consent");
                window.alert("ล้างสถานะคุกกี้เรียบร้อย ระบบจะถามใหม่ในการเข้าใช้งานครั้งถัดไป");
              } catch (error) {
                window.alert("ไม่สามารถล้างการตั้งค่าคุกกี้ได้ กรุณาลองใหม่");
              }
            }}
            className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            ล้างการตั้งค่าคุกกี้
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">5. ช่องทางติดต่อ</h2>
          <p className="mt-3 text-sm text-slate-600">
            หากมีคำถามเกี่ยวกับความเป็นส่วนตัวหรือการใช้ข้อมูลส่วนบุคคล สามารถติดต่อทีม Petskub ได้ที่
            <a href="mailto:privacy@petskub.com" className="font-semibold text-emerald-600"> privacy@petskub.com</a> หรือ LINE Official @petskubrescue
          </p>
        </article>
      </section>
    </div>
  </div>
);

export default Privacy;
