export default function ImagingPage() {
  const backendItems = [
    'MedicalReport model exists in Django',
    'Supported upload formats: PDF, JPG, JPEG, PNG',
    'Imaging types include X-Ray, CT, MRI, PET, Mammography',
    'Pipeline statuses include pending, text_extracted, analysis_complete, approved, rejected, extraction_failed, analysis_failed',
    'AI output fields: extracted_text, extracted_data, insights, recommendations',
    'Imaging findings flow into oncology review',
  ];

  const nextSteps = [
    'Register a MedicalReport API endpoint in Django REST',
    'Add upload/list/detail UI in React',
    'Show processing status and extracted findings',
    'Link approved imaging into oncology records and follow-ups',
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-x-ray"></i> Imaging</h2>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="page-topline">Current backend flow</div>
        <h3 style={{ marginTop: 0 }}>Imaging is backed by the Django MedicalReport pipeline</h3>
        <p className="section-help">
          This module already exists conceptually in the Python backend, but it is not exposed yet as a dedicated REST CRUD route.
          So this page is intentionally honest: the flow exists, the UI wiring is next.
        </p>
      </div>

      <div className="panel-grid">
        <section className="info-panel">
          <div className="panel-title">What exists now</div>
          <ul>
            {backendItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="info-panel">
          <div className="panel-title">Next implementation steps</div>
          <ul>
            {nextSteps.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
