import { type ComputedRef, type InjectionKey, inject, provide } from 'vue'

export interface FormFieldContext {
    id: string
    invalid: ComputedRef<boolean>
    labelledBy?: ComputedRef<string | undefined>
    describedBy?: ComputedRef<string | undefined>
}

const FORM_FIELD_KEY: InjectionKey<FormFieldContext> = Symbol('fp-form-field')

export function provideFormField(context: FormFieldContext) {
    provide(FORM_FIELD_KEY, context)
}

export function useFormField() {
    return inject(FORM_FIELD_KEY, null)
}
