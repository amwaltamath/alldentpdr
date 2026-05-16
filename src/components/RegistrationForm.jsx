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
  requiresLoaner: false,
  dlNumber: '', dlState: 'OH', dlExpiration: '',
  insuranceAuthName: '', signatureName: '', signedAt: '',
  directionToPaySigned: false, repairAuthSigned: false,
  loanerAgreementSigned: false,
};

export default function RegistrationForm() {
  const [form, setForm] = useState(BLANK);
  const [step, setStep] = useState(1); // 1=customer, 2=vehicle, 3=auth
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [jobId, setJobId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      // Capture a precise timestamp the first time either agreement is checked
      if ((key === 'directionToPaySigned' || key === 'repairAuthSigned') && val && !prev.signedAt) {
        next.signedAt = new Date().toISOString();
      }
      return next;
    });
  };

  const canNext1 = form.customerName.trim() && form.email.trim() && form.phone.trim() &&
    form.address.trim() && form.city.trim() && form.zip.trim() && form.howHeard.trim();
  const canNext2 = form.year.trim() && form.make.trim() && form.model.trim() && form.plate.trim() &&
    form.insuranceCompany.trim() && form.deductible.trim() && form.claimNumber.trim() &&
    form.color.trim() && form.vin.trim() &&
    (!form.requiresLoaner || (form.dlNumber.trim() && form.dlExpiration.trim()));
  const canSubmit = form.directionToPaySigned && form.repairAuthSigned && form.signatureName.trim() && form.insuranceAuthName.trim() &&
    (!form.requiresLoaner || form.loanerAgreementSigned);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const id = await registerVehiclePublic(form);
      setJobId(id);
      setStatus('success');

      // Shared event ID for Meta pixel ↔ CAPI deduplication
      const eventId = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const getCookie = (n) => (document.cookie.match('(^|;)\s*' + n + '\s*=\s*([^;]+)') || [])[2] || '';

      // Meta Pixel — CompleteRegistration
      if (typeof fbq === 'function') {
        fbq('track', 'CompleteRegistration', {}, { eventID: eventId });
      }

      // Fire-and-forget registration emails
      fetch('/api/send-registration-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: id,
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          homePhone: form.homePhone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          year: form.year,
          make: form.make,
          model: form.model,
          plate: form.plate,
          vin: form.vin,
          color: form.color,
          insuranceCompany: form.insuranceCompany,
          deductible: form.deductible,
          claimNumber: form.claimNumber,
          notes: form.notes,
          directionToPaySigned: form.directionToPaySigned,
          repairAuthSigned: form.repairAuthSigned,
          insuranceAuthName: form.insuranceAuthName,
          signatureName: form.signatureName,
          signedAt: form.signedAt,
          howHeard: form.howHeard,
          requiresLoaner: form.requiresLoaner,
          dlNumber: form.dlNumber,
          dlState: form.dlState,
          dlExpiration: form.dlExpiration,
          loanerAgreementSigned: form.loanerAgreementSigned,
          event_id: eventId,
          fbc: getCookie('_fbc'),
          fbp: getCookie('_fbp'),
        }),
      }).catch((err) => console.warn('[registration email]', err));
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
              <label htmlFor="r-address">Street address <span aria-hidden>*</span></label>
              <input id="r-address" type="text" value={form.address} onChange={set('address')} required placeholder="123 Main St" />
          </div>

          <div className="reg-row reg-row-3">
            <div className="reg-field">
              <label htmlFor="r-city">City <span aria-hidden>*</span></label>
              <input id="r-city" type="text" value={form.city} onChange={set('city')} required />
            </div>
            <div className="reg-field">
              <label htmlFor="r-state">State</label>
              <select id="r-state" value={form.state} onChange={set('state')}>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="reg-field">
              <label htmlFor="r-zip">ZIP <span aria-hidden>*</span></label>
              <input id="r-zip" type="text" inputMode="numeric" value={form.zip} onChange={set('zip')} required maxLength={10} />
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="r-cell">Cell phone <span aria-hidden>*</span></label>
              <input id="r-cell" type="tel" value={form.phone} onChange={set('phone')} required placeholder="(513) 555-0100" />
            </div>
            <div className="reg-field">
              <label htmlFor="r-home">Home phone <span aria-hidden>*</span></label>
              <input id="r-home" type="tel" value={form.homePhone} onChange={set('homePhone')} required placeholder="(513) 555-0200" />
            </div>
          </div>

          <div className="reg-field full">
            <label htmlFor="r-email">Email address <span aria-hidden>*</span></label>
            <input id="r-email" type="email" value={form.email} onChange={set('email')} required placeholder="jane@example.com" />
          </div>

          <div className="reg-field full">
            <label htmlFor="r-heard">How did you hear about us? <span aria-hidden>*</span></label>
            <input id="r-heard" type="text" value={form.howHeard} onChange={set('howHeard')} required placeholder="Google, referral, social media…" />
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
                <label htmlFor="r-ins-co">Insurance company <span aria-hidden>*</span></label>
                <input id="r-ins-co" type="text" value={form.insuranceCompany} onChange={set('insuranceCompany')} required />
              </div>
              <div className="reg-field">
                <label htmlFor="r-deduct">Deductible <span aria-hidden>*</span></label>
                <input id="r-deduct" type="text" value={form.deductible} onChange={set('deductible')} required placeholder="$500" />
              </div>
              <div className="reg-field">
                <label htmlFor="r-claim">Claim # <span aria-hidden>*</span></label>
                <input id="r-claim" type="text" value={form.claimNumber} onChange={set('claimNumber')} required />
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
                <label htmlFor="r-color">Color <span aria-hidden>*</span></label>
                <input id="r-color" type="text" value={form.color} onChange={set('color')} required placeholder="White" />
              </div>
            </div>
            <div className="reg-field full">
              <label htmlFor="r-vin">VIN # <span aria-hidden>*</span></label>
              <input id="r-vin" type="text" value={form.vin} onChange={set('vin')} required placeholder="1HGCM82633A004352" maxLength={17} />
            </div>
            <div className="reg-field full">
              <label htmlFor="r-notes">Additional notes <span aria-hidden>*</span></label>
              <textarea id="r-notes" rows={3} value={form.notes} onChange={set('notes')} required placeholder="Describe the damage, number of dents, area of vehicle…" />
            </div>
          </fieldset>

          {/* Loaner Vehicle */}
          <fieldset className="reg-fieldset">
            <legend>Loaner Vehicle</legend>
            <div className="reg-field full">
              <label htmlFor="r-loaner">Do you require a loaner vehicle?</label>
              <select
                id="r-loaner"
                value={form.requiresLoaner ? 'yes' : 'no'}
                onChange={(e) => setForm((prev) => ({ ...prev, requiresLoaner: e.target.value === 'yes', loanerAgreementSigned: false }))}
              >
                <option value="no">No</option>
                <option value="yes">Yes — I need a loaner while my vehicle is being repaired</option>
              </select>
            </div>
            {form.requiresLoaner && (
              <>
                <p className="reg-legal" style={{ marginBottom: 12 }}>
                  A loaner vehicle is provided at no charge as a courtesy vehicle. You will need to review and sign
                  the Loaner Vehicle Agreement in the next step. Please provide your driver's license information below.
                </p>
                <div className="reg-row reg-row-3">
                  <div className="reg-field">
                    <label htmlFor="r-dl">Driver's License # <span aria-hidden>*</span></label>
                    <input id="r-dl" type="text" value={form.dlNumber} onChange={set('dlNumber')} required placeholder="DL12345678" />
                  </div>
                  <div className="reg-field">
                    <label htmlFor="r-dl-state">DL State</label>
                    <select id="r-dl-state" value={form.dlState} onChange={set('dlState')}>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="reg-field">
                    <label htmlFor="r-dl-exp">Expiration Date <span aria-hidden>*</span></label>
                    <input id="r-dl-exp" type="text" value={form.dlExpiration} onChange={set('dlExpiration')} required placeholder="MM/YYYY" />
                  </div>
                </div>
              </>
            )}
          </fieldset>
        </>
      )}

      {/* ---- STEP 3: Authorization ---- */}
      {step === 3 && (
        <>
          {/* Loaner Vehicle Agreement */}
          {form.requiresLoaner && (
            <fieldset className="reg-fieldset">
              <legend>Loaner Vehicle Agreement</legend>
              <div className="reg-legal-box">
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Repair Facility: All Dent PDR — 855-425-5336</p>

                <p style={{ fontWeight: 600, marginTop: 12 }}>Customer &amp; Driver Information</p>
                <p className="reg-legal"><strong>Name:</strong> {form.customerName}</p>
                <p className="reg-legal"><strong>Address:</strong> {form.address}, {form.city}, {form.state} {form.zip}</p>
                <p className="reg-legal"><strong>Phone:</strong> {form.phone}</p>
                <p className="reg-legal"><strong>Driver's License:</strong> {form.dlNumber} &nbsp;|&nbsp; <strong>State:</strong> {form.dlState} &nbsp;|&nbsp; <strong>Expires:</strong> {form.dlExpiration}</p>

                <p className="reg-legal" style={{ marginTop: 12 }}>
                  Customer has requested the use of a loaner vehicle while customer's vehicle is being repaired;
                  and All Dent PDR is willing to loan customer a vehicle at no charge, used as a courtesy vehicle
                  and not a rental, subject to the terms and conditions of this Agreement.
                </p>

                <p style={{ fontWeight: 600, marginTop: 14 }}>DRIVER &amp; USE</p>
                <p className="reg-legal">
                  Only the customer listed above is authorized to operate the loaner vehicle unless prior written
                  approval is given by the repair facility. The customer confirms they are at least 25 years of age
                  and hold a valid driver's license.
                </p>
                <p className="reg-legal">The loaner vehicle is <strong>PROHIBITED</strong> to be used for:</p>
                <ul className="reg-legal-list">
                  <li>Commercial purposes (rideshare, delivery, etc.)</li>
                  <li>Racing, off-road use, or illegal activities</li>
                  <li>Towing or hauling</li>
                  <li>Transporting hazardous or illegal materials</li>
                  <li>Allowing unauthorized drivers to operate the vehicle</li>
                </ul>

                <p style={{ fontWeight: 600, marginTop: 14 }}>INSURANCE &amp; RESPONSIBILITY</p>
                <p className="reg-legal">
                  The Customer confirms they carry valid automobile insurance that includes liability and collision
                  coverage ($60,000.00 bodily injury each person / $120,000.00 per accident / $20,000.00 property damage).
                </p>
                <p className="reg-legal">
                  The Customer's insurance will be primary in the event of any traffic/driving violation, accident,
                  damage, theft, or loss.
                </p>
                <p className="reg-legal">
                  The Customer agrees to be financially responsible for all damages, traffic infractions, insurance
                  deductibles, loss of use, towing, impound fees, and diminished value.
                </p>

                <p style={{ fontWeight: 600, marginTop: 14 }}>CONDITION &amp; RETURN</p>
                <p className="reg-legal">
                  The Customer acknowledges receipt of the loaner vehicle in good operating condition, except existing
                  damage as noted at time of vehicle assignment.
                </p>
                <p className="reg-legal">
                  The Customer agrees that if any mechanical trouble with the vehicle including, but not limited to,
                  warning lights, smoke or strange noises, Customer will pull over as soon as it is reasonable and
                  practical to do so and call for assistance. If Customer fails to do so and damage occurs to the
                  vehicle, the Customer may be held responsible for said damage.
                </p>
                <p className="reg-legal">
                  The Customer is expected to return the vehicle immediately upon completion of repairs or upon
                  request by the Repair Facility and return vehicle in the same condition as provided. Failure to
                  return the vehicle as agreed may result in daily charges and/or reporting the vehicle as unauthorized use.
                </p>
                <p className="reg-legal">
                  The vehicle must be returned with the same fuel level as provided. Excessive mileage, smoking,
                  pet damage, cleaning, or misuse may result in additional charges. The Repair Facility is not
                  responsible for personal items left in the loaner vehicle.
                </p>

                <p style={{ fontWeight: 600, marginTop: 14 }}>LIABILITY</p>
                <p className="reg-legal">
                  The Customer agrees to indemnify and hold harmless the repair facility from any claims, losses,
                  damages, or expenses arising from the use or operation of the loaner vehicle.
                </p>
              </div>
              <div className="reg-sign-row">
                <label className="reg-check-label">
                  <input
                    type="checkbox"
                    checked={form.loanerAgreementSigned}
                    onChange={set('loanerAgreementSigned')}
                    required
                  />
                  I have read, understand, and agree to all terms of the Loaner Vehicle Agreement above
                </label>
              </div>
            </fieldset>
          )}

          {/* Direction to Pay */}
          <fieldset className="reg-fieldset">
            <legend>Direction to Pay</legend>
            <div className="reg-row" style={{ marginBottom: 14 }}>
              <div className="reg-field">
                <label htmlFor="r-ins-auth">Insurance Company Name <span aria-hidden>*</span></label>
                <input
                  id="r-ins-auth"
                  type="text"
                  value={form.insuranceAuthName}
                  onChange={set('insuranceAuthName')}
                  placeholder="e.g. State Farm"
                />
              </div>
            </div>
            <p className="reg-legal">
              I authorize <strong>{form.insuranceAuthName || '[ Insurance Company ]'}</strong> Insurance Company to pay All Dent PDR directly for repairs done to my vehicle and ANY rental charges during the time my vehicle is at the shop being repaired.
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
                <label>Date &amp; Time Signed</label>
                <input
                  type="text"
                  value={form.signedAt ? new Date(form.signedAt).toLocaleString() : new Date().toLocaleDateString()}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
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
