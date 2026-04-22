import { useState } from 'react';
import { registerVehiclePublic } from './portal/storage';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

const BLANK = {
  customerName: '', email: '', phone: '', address: '', city: '', state: 'OH',
  zip: '', homePhone: '', howHeard: '',
  year: '', make: '', model: '', plate: '', vin: '', color: '',
  insuranceCompany: '', deductible: '', claimNumber: '',
  notes: '',
  insuranceAuthName: '', signatureName: '',
  directionToPaySigned: false, repairAuthSigned: false
};

export default function RegistrationForm() {
  const [form, setForm] = useState(BLANK);
  const [step, setStep] = useState(1); // 1=customer, 2=vehicle, 3=auth
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [jobId, setJobId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const canNext1 = form.customerName.trim() && form.email.trim() && form.phone.trim();
  const canNext2 = form.year.trim() && form.make.trim() && form.model.trim() && form.plate.trim();
  const canSubmit = form.directionToPaySigned && form.repairAuthSigned && form.signatureName.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const id = await registerVehiclePublic(form);
      setJobId(id);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg('There was a problem submitting your registration. Please call us at 1-855-425-5336.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="reg-success">
        <div className="reg-success-icon">✓</div>
        <h2>You're registered!</h2>
        <p>Your job ID is <strong>{jobId}</strong>. We'll be in touch shortly.</p>
        <p className="reg-success-sub">
          Track your repair status anytime at{' '}
          <a href="/portal/customer-login">alldentpdr.com/portal/customer-login</a>{' '}
          using your email and plate number.
        </p>
        <div className="button-row" style={{ justifyContent: 'center', marginTop: 24 }}>
          <a href="/" className="button primary">Back to home</a>
          <a href="/portal/customer-login" className="button ghost">Track my repair</a>
        </div>
      </div>
    );
  }

  return (
    <form className="reg-form" onSubmit={handleSubmit} noValidate>
      {/* Progress indicator */}
      <div className="reg-steps">
        {['Customer Info', 'Vehicle & Insurance', 'Authorization'].map((label, i) => (
          <div key={i} className={`reg-step${step === i + 1 ? ' is-active' : step > i + 1 ? ' is-done' : ''}`}>
            <span className="reg-step-num">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="reg-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ---- STEP 1: Customer Information ---- */}
      {step === 1 && (
        <fieldset className="reg-fieldset">
          <legend>Customer Information</legend>

          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="r-name">Full name <span aria-hidden>*</span></label>
              <input id="r-name" type="text" value={form.customerName} onChange={set('customerName')} required placeholder="Jane Smith" />
            </div>
            <div className="reg-field">
              <label htmlFor="r-date">Date</label>
              <input id="r-date" type="text" value={new Date().toLocaleDateString()} readOnly />
            </div>
          </div>

          <div className="reg-field full">
            <label htmlFor="r-address">Street address</label>
            <input id="r-address" type="text" value={form.address} onChange={set('address')} placeholder="123 Main St" />
          </div>

          <div className="reg-row reg-row-3">
            <div className="reg-field">
              <label htmlFor="r-city">City</label>
              <input id="r-city" type="text" value={form.city} onChange={set('city')} />
            </div>
            <div className="reg-field">
              <label htmlFor="r-state">State</label>
              <select id="r-state" value={form.state} onChange={set('state')}>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="reg-field">
              <label htmlFor="r-zip">ZIP</label>
              <input id="r-zip" type="text" inputMode="numeric" value={form.zip} onChange={set('zip')} maxLength={10} />
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="r-cell">Cell phone <span aria-hidden>*</span></label>
              <input id="r-cell" type="tel" value={form.phone} onChange={set('phone')} required placeholder="(513) 555-0100" />
            </div>
            <div className="reg-field">
              <label htmlFor="r-home">Home phone</label>
              <input id="r-home" type="tel" value={form.homePhone} onChange={set('homePhone')} placeholder="(513) 555-0200" />
            </div>
          </div>

          <div className="reg-field full">
            <label htmlFor="r-email">Email address <span aria-hidden>*</span></label>
            <input id="r-email" type="email" value={form.email} onChange={set('email')} required placeholder="jane@example.com" />
          </div>

          <div className="reg-field full">
            <label htmlFor="r-heard">How did you hear about us?</label>
            <input id="r-heard" type="text" value={form.howHeard} onChange={set('howHeard')} placeholder="Google, referral, social media…" />
          </div>
        </fieldset>
      )}

      {/* ---- STEP 2: Vehicle & Insurance ---- */}
      {step === 2 && (
        <>
          <fieldset className="reg-fieldset">
            <legend>Insurance Information</legend>
            <div className="reg-row reg-row-3">
              <div className="reg-field">
                <label htmlFor="r-ins-co">Insurance company</label>
                <input id="r-ins-co" type="text" value={form.insuranceCompany} onChange={set('insuranceCompany')} />
              </div>
              <div className="reg-field">
                <label htmlFor="r-deduct">Deductible</label>
                <input id="r-deduct" type="text" value={form.deductible} onChange={set('deductible')} placeholder="$500" />
              </div>
              <div className="reg-field">
                <label htmlFor="r-claim">Claim #</label>
                <input id="r-claim" type="text" value={form.claimNumber} onChange={set('claimNumber')} />
              </div>
            </div>
          </fieldset>

          <fieldset className="reg-fieldset">
            <legend>Vehicle Information</legend>
            <div className="reg-row reg-row-3">
              <div className="reg-field">
                <label htmlFor="r-year">Year <span aria-hidden>*</span></label>
                <input id="r-year" type="text" inputMode="numeric" value={form.year} onChange={set('year')} required placeholder="2022" maxLength={4} />
              </div>
              <div className="reg-field">
                <label htmlFor="r-make">Make <span aria-hidden>*</span></label>
                <input id="r-make" type="text" value={form.make} onChange={set('make')} required placeholder="Toyota" />
              </div>
              <div className="reg-field">
                <label htmlFor="r-model">Model <span aria-hidden>*</span></label>
                <input id="r-model" type="text" value={form.model} onChange={set('model')} required placeholder="Camry" />
              </div>
            </div>
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="r-plate">License plate <span aria-hidden>*</span></label>
                <input id="r-plate" type="text" value={form.plate} onChange={set('plate')} required placeholder="ABC1234" />
              </div>
              <div className="reg-field">
                <label htmlFor="r-color">Color</label>
                <input id="r-color" type="text" value={form.color} onChange={set('color')} placeholder="White" />
              </div>
            </div>
            <div className="reg-field full">
              <label htmlFor="r-vin">VIN #</label>
              <input id="r-vin" type="text" value={form.vin} onChange={set('vin')} placeholder="1HGCM82633A004352" maxLength={17} />
            </div>
            <div className="reg-field full">
              <label htmlFor="r-notes">Additional notes</label>
              <textarea id="r-notes" rows={3} value={form.notes} onChange={set('notes')} placeholder="Describe the damage, number of dents, area of vehicle…" />
            </div>
          </fieldset>
        </>
      )}

      {/* ---- STEP 3: Authorization ---- */}
      {step === 3 && (
        <>
          {/* Direction to Pay */}
          <fieldset className="reg-fieldset">
            <legend>Direction to Pay</legend>
            <p className="reg-legal">
              I authorize <input
                type="text"
                className="reg-inline-input"
                value={form.insuranceAuthName}
                onChange={set('insuranceAuthName')}
                placeholder="Insurance company name"
              /> Insurance Company to pay All Dent PDR directly for repairs done to my vehicle and ANY rental charges during the time my vehicle is at the shop being repaired.
            </p>
            <p className="reg-legal">
              I do hereby appoint All Dent PDR to accept on my behalf, any and all checks/drafts and to endorse all such checks/drafts for deposit to All Dent PDR account for payment for repairs to said vehicle, which have been accepted and released. The total amount of repair charges must be paid in full before the vehicle can be released for delivery or picked up. If insurance coverage pays either a portion of or the total amount due, I acknowledge that the insurance check/draft must be obtained by me or sent in advance by the insurance company and received by All Dent PDR. I also acknowledge that I must make arrangements with any lien holder or other payees to endorse the insurance check/draft prior to the release of the above repaired vehicle. I authorize any and all supplements payable directly to All Dent PDR for the consideration of repairs made to the vehicle. If I remove my vehicle from the shop prior to the completion of repairs, I agree to pay for parts, labor, handling fees, service charges, and rental car fees associated with the repair. To secure payment in amount of repairs, an expressed mechanics lien on the vehicle is acknowledged and I further agree to pay reasonable attorney's fees and court costs in the event legal action becomes necessary to enforce this contract. All Dent PDR may repossess my vehicle if payment is not secured.
            </p>
            <div className="reg-sign-row">
              <label className="reg-check-label">
                <input type="checkbox" checked={form.directionToPaySigned} onChange={set('directionToPaySigned')} required />
                I agree to the Direction to Pay terms above
              </label>
            </div>
          </fieldset>

          {/* Repair Authorization */}
          <fieldset className="reg-fieldset">
            <legend>Repair Authorization</legend>
            <p className="reg-legal">
              I hereby authorize All Dent PDR employees/contractors to operate my vehicle for the purpose of testing, inspection, delivery to and from for repairs. I acknowledge and agree that All Dent PDR will not be held responsible for loss or damage to the vehicle or articles left in the vehicle in case of fire, theft, vehicle accident, or any other cause beyond the control of All Dent PDR. Further, I acknowledge, that if closer analysis reveals additional repairs are necessary, either I or my insurance company will be contacted for authorization of any additional repair charges. If new parts listed in the insurance estimate are not available or replaceable by All Dent PDR, I authorize All Dent PDR to repair such parts when possible. Old parts will be disposed of unless otherwise instructed. I authorize All Dent PDR to manufacture access to dents that may not be accessible due to their location on the vehicle. And as such, All Dent PDR is not responsible for any unrelated prior damage (UPD) noted in the estimate or damage caused by prior work performed on the vehicle.
            </p>
            <p className="reg-legal">
              <strong>I authorize All Dent PDR to perform repairs on my vehicle per All Dent PDR estimate.</strong>
            </p>
            <div className="reg-sign-row">
              <label className="reg-check-label">
                <input type="checkbox" checked={form.repairAuthSigned} onChange={set('repairAuthSigned')} required />
                I agree to the Repair Authorization terms above
              </label>
            </div>
          </fieldset>

          {/* Signature */}
          <fieldset className="reg-fieldset">
            <legend>Signature</legend>
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor="r-sig">Type your full name as signature <span aria-hidden>*</span></label>
                <input id="r-sig" type="text" value={form.signatureName} onChange={set('signatureName')} required placeholder="Jane Smith" className="reg-sig-input" />
              </div>
              <div className="reg-field">
                <label>Date</label>
                <input type="text" value={new Date().toLocaleDateString()} readOnly />
              </div>
            </div>
            <p className="reg-legal" style={{ marginTop: 8 }}>
              By typing your name above and checking both boxes, you agree this constitutes your legal electronic signature on both the Direction to Pay and Repair Authorization agreements.
            </p>
          </fieldset>

          {errorMsg && <p className="portal-error">{errorMsg}</p>}
        </>
      )}

      {/* Navigation buttons */}
      <div className="reg-nav">
        {step > 1 && (
          <button type="button" className="button ghost" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </button>
        )}

        {step < 3 && (
          <button
            type="button"
            className="button primary"
            disabled={step === 1 ? !canNext1 : !canNext2}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue →
          </button>
        )}

        {step === 3 && (
          <button
            type="submit"
            className="button primary"
            disabled={!canSubmit || status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Registration'}
          </button>
        )}
      </div>
    </form>
  );
}
