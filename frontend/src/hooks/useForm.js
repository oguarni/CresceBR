import { useState } from 'react';

export const useForm = (initialState) => {
  const [form, setForm] = useState(initialState);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setForm(initialState);

  const setForm = (newForm) => setForm(newForm);

  return { form, updateField, resetForm, setForm };
};