// Data edukasi bagian-bagian sepatu
// Digunakan di EducationPanel dan ARScene

export const shoePartsData = [
  {
    id: 'upper',
    name: 'Upper (Bagian Atas)',
    emoji: '👟',
    color: '#e94560',
    description:
      'Panel suede membentuk badan utama Puma Suede. Upper membungkus kaki, menjaga bentuk sepatu, dan menjadi tempat panel samping serta tali terpasang.',
    material: 'Suede; detail dapat berbeda menurut varian',
    function: 'Perlindungan & Estetika',
  },
  {
    id: 'midsole',
    name: 'Midsole (Sol Tengah)',
    emoji: '🧱',
    color: '#f59e0b',
    description:
      'Area sambungan antara badan sepatu dan sol luar. Bentuknya mengikuti konstruksi sol model ini; komposisi lapisan internal tidak bisa dipastikan dari tampilan luar saja.',
    material: 'Konstruksi sol; bahan internal tidak terlihat',
    function: 'Menghubungkan upper dengan sol luar',
  },
  {
    id: 'outsole',
    name: 'Outsole (Sol Luar)',
    emoji: '🔲',
    color: '#10b981',
    description:
      'Bagian bawah sepatu yang bersentuhan dengan permukaan. Pola dan kompon karet pada outsole membantu memberikan cengkeraman dan ketahanan saat digunakan.',
    material: 'Karet (umum pada Puma Suede)',
    function: 'Cengkeraman & ketahanan',
  },
  {
    id: 'insole',
    name: 'Insole (Sol Dalam)',
    emoji: '🛏️',
    color: '#8b5cf6',
    description:
      'Permukaan bagian dalam yang bersentuhan dengan telapak kaki. Insole berada di dalam sepatu, sehingga tidak tampak pada model dari sisi luar dan penandanya hanya perkiraan.',
    material: 'Bahan dan bentuk bergantung varian',
    function: 'Permukaan pijakan & kenyamanan',
  },
  {
    id: 'tongue',
    name: 'Tongue (Lidah Sepatu)',
    emoji: '👅',
    color: '#3b82f6',
    description:
      'Lidah berada di bawah tali dan di atas punggung kaki. Bagian ini membantu mengurangi tekanan tali; detail bahan atau bantalan dapat berbeda menurut varian.',
    material: 'Suede atau tekstil, bergantung varian',
    function: 'Melindungi punggung kaki dari tekanan tali',
  },
  {
    id: 'heel',
    name: 'Heel Counter (Penguat Tumit)',
    emoji: '🔒',
    color: '#ef4444',
    description:
      'Area belakang membungkus tumit. Penguat tumit berada di dalam lapisan sepatu dan tidak dapat dipastikan hanya dari model luar; penanda menunjukkan area tumit secara umum.',
    material: 'Panel luar suede; penguat internal tidak terlihat',
    function: 'Membantu menjaga bentuk dan kestabilan tumit',
  },
];

export default shoePartsData;
