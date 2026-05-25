import Swal from 'sweetalert2';

const isDark = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
};

export const alert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#00a568',
      background: isDark() ? '#1e1e1e' : '#ffffff',
      color: isDark() ? '#f3f4f6' : '#1f2937',
      customClass: {
        popup: 'rounded-3xl border border-gray-100 dark:border-gray-800 font-sans shadow-2xl',
        confirmButton: 'px-6 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-[0.97]'
      }
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#e11d48',
      background: isDark() ? '#1e1e1e' : '#ffffff',
      color: isDark() ? '#f3f4f6' : '#1f2937',
      customClass: {
        popup: 'rounded-3xl border border-gray-100 dark:border-gray-800 font-sans shadow-2xl',
        confirmButton: 'px-6 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-[0.97]'
      }
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#f59e0b',
      background: isDark() ? '#1e1e1e' : '#ffffff',
      color: isDark() ? '#f3f4f6' : '#1f2937',
      customClass: {
        popup: 'rounded-3xl border border-gray-100 dark:border-gray-800 font-sans shadow-2xl',
        confirmButton: 'px-6 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-[0.97]'
      }
    });
  },
  confirm: (title: string, text: string, onConfirm: () => void) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#00a568',
      cancelButtonColor: '#9ca3af',
      background: isDark() ? '#1e1e1e' : '#ffffff',
      color: isDark() ? '#f3f4f6' : '#1f2937',
      customClass: {
        popup: 'rounded-3xl border border-gray-100 dark:border-gray-800 font-sans shadow-2xl',
        confirmButton: 'px-6 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-[0.97] mr-2',
        cancelButton: 'px-6 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-[0.97]'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  }
};
