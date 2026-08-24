import { useEffect, useState } from 'react';
import { fetchPatients, addPatient, removePatient, editPatient } from '../services/patientService';
import type { PatientsApi } from '@org/api-client';

export default function PatientList({ onLogout }: { onLogout: () => void }) {
  const [patients, setPatients] = useState<PatientsApi.PatientResponseDto[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PatientsApi.UpdatePatientDto>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setPatients(await fetchPatients());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const patient = await addPatient({
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender: 'OTHER',
      });
      setPatients((prev) => [...prev, patient]);
      setFirstName('');
      setLastName('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient');
    }
  }

  async function handleDelete(id: string) {
    try {
      await removePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
    }
  }

  function startEdit(p: PatientsApi.PatientResponseDto) {
    setEditingId(p.id);
    setEditForm({
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleSaveEdit(id: string) {
    try {
      const updated = await editPatient(id, editForm);
      setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient');
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2>Patients</h2>
        <button onClick={onLogout}>Log out</button>
      </div>
      <p style={{ color: '#666', fontSize: 13 }}>
        Types below come from <code>@org/api-client</code>, generated from the backend's
        NestJS decorators — no hand-written interfaces.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
        <button type="submit">Add Patient</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th>MRN</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Email</th>
            <th>Registered</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) =>
            editingId === p.id ? (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee', background: '#fffbeb' }}>
                <td>{p.mrn}</td>
                <td style={{ display: 'flex', gap: 4, padding: '6px 0' }}>
                  <input
                    style={{ width: 70 }}
                    value={editForm.firstName ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                  <input
                    style={{ width: 70 }}
                    value={editForm.lastName ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    style={{ width: 130 }}
                    value={editForm.dateOfBirth ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    style={{ width: 150 }}
                    value={editForm.email ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button onClick={() => handleSaveEdit(p.id)}>Save</button>{' '}
                  <button onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{p.mrn}</td>
                <td>{p.firstName} {p.lastName}</td>
                <td>{p.dateOfBirth}</td>
                <td>{p.email}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button onClick={() => startEdit(p)}>Edit</button>{' '}
                  <button onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ),
          )}
          {patients.length === 0 && (
            <tr><td colSpan={6} style={{ color: '#999', padding: '12px 0' }}>No patients yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
