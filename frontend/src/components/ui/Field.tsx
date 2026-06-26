interface FieldProps {
  label: string
  value?: string | number | null
}

export default function Field({ label, value }: FieldProps) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="text-sm text-on-surface">{value ?? '—'}</p>
    </div>
  )
}
