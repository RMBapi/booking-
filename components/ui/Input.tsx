import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils";
import { Label } from "./Label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={inputId}>
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={cn(
              "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2",
              "text-sm text-gray-900 placeholder:text-gray-400",
              "transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error &&
                "border-red-300 focus-visible:ring-red-500 text-red-900 placeholder:text-red-400",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className, id, required, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={textareaId}>
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </Label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          required={required}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3",
            "text-sm text-gray-900 placeholder:text-gray-400",
            "transition-colors resize-y",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            error &&
              "border-red-300 focus-visible:ring-red-500 text-red-900 placeholder:text-red-400",
            className
          )}
          {...props}
        />
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helperText, options, className, id, required, ...props },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={selectId}>
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </Label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2",
            "text-sm text-gray-900",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            error &&
              "border-red-300 focus-visible:ring-red-500 text-red-900",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
