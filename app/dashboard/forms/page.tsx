import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import CreateFormSheet from "@/app/dashboard/forms/__components/create-form-sheet";

export default function FormsPage() {
  return (
    <DashboardWrapper
      title="Forms"
      actions={
        <div>
          <CreateFormSheet />
        </div>
      }
    >
      form
    </DashboardWrapper>
  );
}
