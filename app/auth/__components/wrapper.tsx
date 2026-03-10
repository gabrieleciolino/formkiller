export default function AuthWrapper({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md m-auto p-4">
      <div className="border rounded-xl p-8 flex flex-col gap-4">
        <h2 className="text-2xl mx-auto">{title}</h2>
        {children}
      </div>
    </div>
  );
}
