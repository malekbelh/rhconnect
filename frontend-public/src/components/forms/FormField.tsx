import React from 'react';
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  type = 'text',
  placeholder,
  register,
  error,
  required = false,
  disabled = false,
}) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-700"
      >
        {label}
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-neutral-800 placeholder:text-neutral-400 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500/20
          ${error
            ? 'border-danger-500 focus:border-danger-500 bg-red-50/50'
            : 'border-neutral-300 focus:border-primary-500 bg-white hover:border-neutral-400'
          }
          ${disabled ? 'bg-neutral-100 cursor-not-allowed text-neutral-500' : ''}
        `}
      />
      {error && (
        <p className="text-sm text-danger-500 flex items-center gap-1">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormField;
