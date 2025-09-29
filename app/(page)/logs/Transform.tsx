import { forwardRef } from "react";
type ChildRef = {};
type ChildProps = {};
const AddLogs = forwardRef<ChildRef, ChildProps>((props, ref) => {
  return (
    <div>
      <div>AddLogs</div>
    </div>
  );
});
export default AddLogs;
