'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Controller, FormProvider, useFormContext, useFormState, type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const Form = FormProvider;
const FormFieldContext = React.createContext<{ name: string }>({ name: '' });
const FormItemContext = React.createContext<{ id: string }>({ id: '' });

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(props: ControllerProps<TFieldValues, TName>) {
  return <FormFieldContext.Provider value={{ name: props.name }}><Controller {...props}/></FormFieldContext.Provider>;
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  if (!fieldContext.name) throw new Error('useFormField must be used within <FormField>.');
  const fieldState = getFieldState(fieldContext.name, formState);
  return {
    ...fieldState,
    name: fieldContext.name,
    formItemId: `${itemContext.id}-form-item`,
    formDescriptionId: `${itemContext.id}-form-item-description`,
    formMessageId: `${itemContext.id}-form-item-message`,
  };
}

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();
  return <FormItemContext.Provider value={{ id }}><div className={cn('space-y-2', className)} {...props}/></FormItemContext.Provider>;
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();
  return <Label htmlFor={formItemId} className={cn(error && 'text-destructive', className)} {...props}/>;
}

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  const describedBy = error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId;
  return <Slot ref={ref} id={formItemId} aria-describedby={describedBy} aria-invalid={!!error} {...props}/>;
});
FormControl.displayName = 'FormControl';

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField();
  return <p id={formDescriptionId} className={cn('text-xs text-muted-foreground', className)} {...props}/>;
}

function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? '') : children;
  if (!body) return null;
  return <p id={formMessageId} role="alert" className={cn('text-xs font-medium text-destructive', className)} {...props}>{body}</p>;
}

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField };
