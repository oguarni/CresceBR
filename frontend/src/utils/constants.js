export const categories = [
  'Todas', 
  'Maquinário', 
  'Matéria-Prima', 
  'Componentes', 
  'Ferramentas', 
  'Equipamentos'
];

export const industrialSectors = [
  'metalurgia',
  'automotivo', 
  'petrochemical',
  'alimenticio',
  'textil',
  'construcao',
  'eletroeletronico',
  'farmaceutico',
  'papel',
  'outros'
];

export const urgencyLevels = {
  normal: { label: 'Normal', days: 30 },
  urgent: { label: 'Urgente', days: 15 },
  express: { label: 'Express', days: 7 }
};

export const quoteStatuses = {
  pending: 'Aguardando resposta',
  responded: 'Cotação recebida', 
  accepted: 'Cotação aceita',
  rejected: 'Cotação rejeitada'
};