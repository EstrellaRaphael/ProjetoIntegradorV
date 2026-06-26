interface Tab<T extends string> {
  key: T
  label: string
}

interface TabNavProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (key: T) => void
}

export default function TabNav<T extends string>({ tabs, active, onChange }: TabNavProps<T>) {
  return (
    <div className="tab-nav">
      <div className="tab-nav-inner">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`tab-nav-item ${active === t.key ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
