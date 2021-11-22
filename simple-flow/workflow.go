package simple_flow

import (
	"errors"
	"fmt"
	"time"

	"github.com/davecgh/go-spew/spew"

	"go.temporal.io/api/enums/v1"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

type ComplexWFInput struct {
	Name string
}

type ComplexWFOutput struct {
	RunID   string
	Attempt int
}

func ComplexWorkflow(ctx workflow.Context, input ComplexWFInput) (ComplexWFOutput, error) {
	// Has multi-stage state changes?
	i := workflow.GetInfo(ctx)
	// Simulate slowness here??
	//workflow.Sleep(ctx, time.Second)
	runID := fmt.Sprintf("RUNID: %s ==> %s", input.Name, i.WorkflowExecution.RunID)
	res := ComplexWFOutput{
		RunID:   runID,
		Attempt: int(i.Attempt),
	}
	return res, nil
}

func SimpleWorkflow(ctx workflow.Context) (string, error) {
	i := workflow.GetInfo(ctx)
	result := fmt.Sprintf("RUNID: %s", i.WorkflowExecution.RunID)
	fmt.Sprintf("Attempt: %d WID: %s", i.Attempt, i.WorkflowExecution.ID)
	// Starts uo child TS WOrkflow
	cwo := workflow.ChildWorkflowOptions{
		TaskQueue: "typescript.queue",
		RetryPolicy: &temporal.RetryPolicy{
			MaximumAttempts: 1,
		},
	}
	ctxChild := workflow.WithChildOptions(ctx, cwo)
	cwf := workflow.ExecuteChildWorkflow(ctxChild, "simple_workflow_ts", i.WorkflowExecution.ID)
	var childRes string
	gerr := cwf.Get(ctxChild, &childRes)
	if gerr != nil {
		spew.Dump(gerr)
		return "", gerr
	}
	fmt.Println("RES_TS: ", childRes)
	// End ChildWrokflow ..
	// Execute activity not registered ..
	ao := workflow.ActivityOptions{
		ScheduleToCloseTimeout: time.Second * 20, // for totsl including retry
		StartToCloseTimeout:    time.Second * 3,  // for single attempt
		RetryPolicy: &temporal.RetryPolicy{
			NonRetryableErrorTypes: []string{
				//"TEST0",
				//"TESTx",
			},
		},
	}
	actx := workflow.WithActivityOptions(ctx, ao)
	f := workflow.ExecuteActivity(actx, SimpleActivity, nil)
	// If forget to register Activity; it will hit the  ScheduleToStart  which
	// will default restart the workfloow forever; you will see ACT timeout  ..
	err := f.Get(actx, nil)
	if err != nil {
		// Soomething wrong ...
		// check common cases ...
		if temporal.IsApplicationError(err) {
			fmt.Println("yyyyyxxxx APPERR xxxx")
		} else if temporal.IsPanicError(err) {
			fmt.Println("yyyyxxxx PANIC xxxxx")
		} else if temporal.IsCanceledError(err) {
			fmt.Println("yyyyxxxx CANCELED xxxxx")
		} else if temporal.IsTerminatedError(err) {
			fmt.Println("yyyyyxxxx TERMINATED xxxxx")
		} else if temporal.IsTimeoutError(err) {
			fmt.Println("yyyyxxxx TIMEOUT xxxxx")
		} else if temporal.IsWorkflowExecutionAlreadyStartedError(err) {
			fmt.Println("yyyyxxxx WFSTART xxxxx")
		} else {
			fmt.Println("yyyyxxxx UNKNOWN ERROOR xxx")
		}

		// check generic
		var actErr *temporal.ActivityError
		if errors.As(err, &actErr) {
			fmt.Println("yyyyACT TYPE: ", actErr.ActivityType().GetName(), " ERR: ", actErr.Unwrap().Error())
		}

		var wfErr *temporal.WorkflowExecutionError
		if errors.As(err, &wfErr) {
			fmt.Println("yyyyWF TYPE: ", wfErr.Unwrap().Error())
		}

		var appErr *temporal.ApplicationError
		if errors.As(err, &appErr) {
			fmt.Println("yyyyAPP TYPE: ", appErr.Type())
		}

		return "", temporal.NewApplicationError("TEST0", "TEST0", err.Error())
	}

	return result, nil
}

func SimpleActivity() error {
	return nil
	//return temporal.NewApplicationError("TESTx", "TESTx", fmt.Errorf("BOOO@@"))
}

// Example frmo temproal erroor package
func appErrHelper(err error) {
	/*
	   	err := workflow.ExecuteActivity(ctx, MyActivity, ...).Get(ctx, nil)
	      if err != nil {
	      	var applicationErr *ApplicationError
	      	if errors.As(err, &applicationError) {
	      		// retrieve error message
	      		fmt.Println(applicationError.Error())

	      		// handle activity errors (created via NewApplicationError() API)
	      		var detailMsg string // assuming activity return error by NewApplicationError("message", true, "string details")
	      		applicationErr.Details(&detailMsg) // extract strong typed details

	      		// handle activity errors (errors created other than using NewApplicationError() API)
	      		switch err.Type() {
	      		case "CustomErrTypeA":
	      			// handle CustomErrTypeA
	      		case CustomErrTypeB:
	      			// handle CustomErrTypeB
	      		default:
	      			// newer version of activity could return new errors that workflow was not aware of.
	      		}
	      	}


	*/
	var applicationErr *temporal.ApplicationError
	if errors.As(err, &applicationErr) {
		// retrieve error message
		fmt.Println(applicationErr.Error())

		// handle activity errors (created via NewApplicationError() API)
		var detailMsg string               // assuming activity return error by NewApplicationError("message", true, "string details")
		applicationErr.Details(&detailMsg) // extract strong typed details

		// handle activity errors (errors created other than using NewApplicationError() API)
		switch applicationErr.Type() {
		//case "CustomErrTypeA":
		//	// handle CustomErrTypeA
		//case CustomErrTypeB:
		//	// handle CustomErrTypeB
		default:
			// newer version of activity could return new errors that workflow was not aware of.
			fmt.Println("APP_ERR_TYPE: ", applicationErr.Type())
		}

	}
}

func timeoutErrHelper(err error) {
	var timeoutErr *temporal.TimeoutError
	if errors.As(err, &timeoutErr) {
		// handle timeout, could check timeout type by timeoutErr.TimeoutType()
		switch timeoutErr.TimeoutType() {
		case enums.TIMEOUT_TYPE_SCHEDULE_TO_START:
			// Handle ScheduleToStart timeout.
		case enums.TIMEOUT_TYPE_START_TO_CLOSE:
			// Handle StartToClose timeout.
		case enums.TIMEOUT_TYPE_HEARTBEAT:
			// Handle heartbeat timeout.
		default:
			// what is it?
			// enums here: 	"go.temporal.io/api/enums/v1"
		}
	}

}

func miscErrHelper(err error) {
	// noot used for noow ..
	// cncel
	var canceledErr *temporal.CanceledError
	if errors.As(err, &canceledErr) {
		// handle cancellation
	}
	// panic
	var panicErr *temporal.PanicError
	if errors.As(err, &panicErr) {
		// handle panic, message and stack trace are available by panicErr.Error() and panicErr.StackTrace()
	}
}
