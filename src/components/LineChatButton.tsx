// Line Chat Button Component

export function LineChatButton(label: string, url: string) {
  // validate line URL
  try {
    const newUrl = new URL(url);
    if (newUrl.hostname !== 'line.me' && newUrl.hostname !== 'liff.line.me') return null;
  } catch {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="w-fit sticky float-right bottom-5 right-5 ml-auto mb-5 z-50 rounded-full bg-[#06C755] text-white px-5 py-3 shadow-xl hover:opacity-90"
    >
      {label}
    </a>
  );
}