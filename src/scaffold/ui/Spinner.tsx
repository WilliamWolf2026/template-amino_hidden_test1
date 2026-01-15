interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export function Spinner(props: SpinnerProps) {
  const size = () => props.size ?? 'md';

  return (
    <div
      class={`
        ${sizeClasses[size()]}
        border-white border-t-transparent
        rounded-full animate-spin
        ${props.class ?? ''}
      `.trim()}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay(props: LoadingOverlayProps) {
  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
      <Spinner size="lg" />
      {props.message && (
        <p class="mt-4 text-white text-lg">{props.message}</p>
      )}
    </div>
  );
}
