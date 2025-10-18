import { PathValidator } from '@/components/path-validator'

export default function SettingsPage() {
  return (
    <div className=\"container mx-auto py-8\">
      <h1 className=\"text-3xl font-bold mb-8\">Settings</h1>
      
      <div className=\"grid gap-6\">
        <PathValidator />
      </div>
    </div>
  )
}
