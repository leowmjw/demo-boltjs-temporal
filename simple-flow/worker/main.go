package main

import (
	simpleflow "app/simple-flow"
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"go.temporal.io/sdk/temporal"

	"go.temporal.io/sdk/client"

	"go.temporal.io/sdk/worker"
)

func main() {
	fmt.Println("START run ===========================> *****")
	c, err := client.NewClient(client.Options{})
	if err != nil {
		panic(err)
	}
	defer c.Close()

	run(c)
}

func run(c client.Client) {
	// Go func is 1st class citizen
	//f := bug_childwf_ended.ChildWFEndedWorkflow
	//cf := bug_childwf_ended.ActualChildWorkflow
	q := "catchnoactwf.queue"

	go func() {
		var wg sync.WaitGroup
		startUnix := time.Now().Unix()

		for i := 0; i < 5; i++ {
			wg.Add(1)
			go func(j int) {
				defer wg.Done()

				wfid := fmt.Sprintf("mleow-%d", j)

				wfr, xerr := c.ExecuteWorkflow(context.Background(),
					client.StartWorkflowOptions{
						ID:        wfid,
						TaskQueue: q,
						//WorkflowExecutionTimeout: time.Second * 11,
						RetryPolicy: &temporal.RetryPolicy{
							NonRetryableErrorTypes: []string{
								//"TEST0",
							},
						},
					}, simpleflow.SimpleWorkflow)
				if xerr != nil {
					// check common cases ...
					if temporal.IsApplicationError(xerr) {
						fmt.Println("xxxx APPERR xxxx")
					} else if temporal.IsPanicError(xerr) {
						fmt.Println("xxxx PANIC xxxxx")
					} else if temporal.IsCanceledError(xerr) {
						fmt.Println("xxxx CANCELED xxxxx")
					} else if temporal.IsTerminatedError(xerr) {
						fmt.Println("xxxx TERMINATED xxxxx")
					} else if temporal.IsTimeoutError(xerr) {
						fmt.Println("xxxx TIMEOUT xxxxx")
					} else if temporal.IsWorkflowExecutionAlreadyStartedError(xerr) {
						fmt.Println("xxxx WFSTART xxxxx")
					} else {
						fmt.Println("xxxx UNKNOWN ERROOR xxx")
					}

					// check generic
					var actErr *temporal.ActivityError
					if errors.As(xerr, &actErr) {
						fmt.Println("ACT TYPE: ", actErr.ActivityType().GetName())
					}

					var wfErr *temporal.WorkflowExecutionError
					if errors.As(xerr, &wfErr) {
						fmt.Println("WF TYPE: ", wfErr.Unwrap().Error())
					}

					// This does not seem to work .. :sad??
					var appErr *temporal.ApplicationError
					if errors.As(xerr, &appErr) {
						fmt.Println("APP TYPE: ", appErr.Type())
					}

					fmt.Println("DIE in SimpleWorkflow!!! ERR: ", xerr.Error())
					//spew.Dump(errors.Unwrap(xerr))
					//panic(xerr)
					return
					// see if can catch up
				}
				var res string
				werr := wfr.Get(context.Background(), &res)
				if werr != nil {
					// check common cases ...
					if temporal.IsApplicationError(werr) {
						fmt.Println("xxxx APPERR xxxx")
					} else if temporal.IsPanicError(werr) {
						fmt.Println("xxxx PANIC xxxxx")
					} else if temporal.IsCanceledError(werr) {
						fmt.Println("xxxx CANCELED xxxxx")
					} else if temporal.IsTerminatedError(werr) {
						fmt.Println("xxxx TERMINATED xxxxx")
					} else if temporal.IsTimeoutError(werr) {
						fmt.Println("xxxx TIMEOUT xxxxx")
					} else if temporal.IsWorkflowExecutionAlreadyStartedError(werr) {
						fmt.Println("xxxx WFSTART xxxxx")
					} else {
						fmt.Println("xxxx UNKNOWN ERROOR xxx")
					}

					// check generic
					var actErr *temporal.ActivityError
					if errors.As(werr, &actErr) {
						fmt.Println("ACT TYPE: ", actErr.ActivityType().GetName(), " ERR: ", actErr.Unwrap().Error())
					}

					var wfErr *temporal.WorkflowExecutionError
					if errors.As(werr, &wfErr) {
						fmt.Println("WF TYPE: ", wfErr.Unwrap().Error())
					}

					// This does not seem to work .. :sad??
					var appErr *temporal.ApplicationError
					if errors.As(werr, &appErr) {
						fmt.Println("APP TYPE: ", appErr.Type())
						if appErr.Type() == "" {
							fmt.Println("REmemner to regostr ACtivity!!")
						}
					}

					fmt.Println("DIE!!! in Get of SimpleWorkflow")
					//spew.Dump(werr)
					//panic(werr)
					return
				}
				// Print result of Workflow
				fmt.Println("RES: ", res)
			}(i)
		}
		//	block until done ..
		wg.Wait()
		fmt.Println("TOTAL:  ", time.Now().Unix()-startUnix)

	}()

	go startSignal()

	//go startWorker()
	// Blocking operation ..
	w := worker.New(c, q, worker.Options{
		WorkerStopTimeout:                      time.Second * 5,
		MaxConcurrentActivityTaskPollers:       20,
		MaxConcurrentWorkflowTaskExecutionSize: 20,
	})
	// Register worker Workflow + Activity
	w.RegisterWorkflow(simpleflow.SimpleWorkflow)
	w.RegisterActivity(simpleflow.SimpleActivity)
	//w.RegisterWorkflow(f)
	//w.RegisterWorkflow(cf)
	// Run the Worker
	// Block waiting to end
	rerr := w.Run(worker.InterruptCh())
	if rerr != nil {
		// log failure
		panic(rerr)
	}

}

func startWorker() {

}

func startSignal() {
	//time.Sleep(time.Second * 2)
	//fmt.Println("SIGNSAL NOW!!")
	//serr := c.SignalWorkflow(context.Background(), "/abc/def/password", "", "trigger", nil)
	//if serr != nil {
	//	fmt.Println("SIGNALERR: ", serr)
	//	startWF()
	//}
	//time.Sleep(time.Second * 5)
	//fmt.Println("SIGNSAL2 NOW!!")
	//serr = c.SignalWorkflow(context.Background(), "/abc/def/password", "", "trigger", nil)
	//if serr != nil {
	//	fmt.Println("SIGNALERR: ", serr)
	//	startWF()
	//}
	//time.Sleep(time.Second * 5)
	//fmt.Println("SIGNSAL3 NOW!!")
	//serr = c.SignalWorkflow(context.Background(), "/abc/def/password", "", "trigger", nil)
	//if serr != nil {
	//	fmt.Println("SIGNALERR: ", serr)
	//	startWF()
	//}

}
