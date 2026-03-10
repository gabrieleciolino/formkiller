export default function DashboardWrapper({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}
