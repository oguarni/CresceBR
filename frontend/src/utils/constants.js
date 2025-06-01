export const categories = ['Todas', 'Maquinário', 'Matéria-Prima', 'Componentes'];

export const calculateShipping = (cep) => {
  const cepPrefix = cep.substring(0, 2);
  if (cepPrefix >= '80' && cepPrefix <= '87') return 15.90;
  if (cepPrefix >= '88' && cepPrefix <= '89') return 25.90;
  return 35.90;
};