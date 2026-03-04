interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  class?: string;
}

export function ProgressBar(props: ProgressBarProps) {
  return (
    <div class={`w-full max-w-xs ${props.class ?? ''}`}>
      {props.label && (
        <p class="text-gray-400 text-sm mb-2 text-center">{props.label}</p>
      )}
      <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, props.progress))}%` }}
        />
      </div>
    </div>
  );
}
