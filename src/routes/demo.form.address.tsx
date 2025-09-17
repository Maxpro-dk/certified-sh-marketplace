import { createFileRoute } from '@tanstack/react-router'

import { useAppForm } from '../hooks/demo.form'
import Marketplace from '@/components/Marketplace'

export const Route = createFileRoute('/demo/form/address')({
  component: AddressForm,
})

function AddressForm() {
  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      phone: '',
    },
    validators: {
      onBlur: ({ value }) => {
        const errors = {
          fields: {},
        } as {
          fields: Record<string, string>
        }
        if (value.fullName.trim().length === 0) {
          errors.fields.fullName = 'Full name is required'
        }
        return errors
      },
    },
    onSubmit: ({ value }) => {
      console.log(value)
      // Show success message
      alert('Form submitted successfully!')
    },
  })

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 5% 40%, #f4a460 0%, #8b4513 70%, #1a0f0a 100%)',
      }}
    >
      <div className="w-full p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <Marketplace></Marketplace>
      </div>
    </div>
  )
}
