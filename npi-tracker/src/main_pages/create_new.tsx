import { useState } from "react";

import {
    Button,
    Card,
    ProgressBar
} from "@fluentui/react-components";

import OrderDetailsStep from "../components/new_build_components/OrderDetails";
import RackSn from "../components/new_build_components/RackSn";
import ReviewBuild from "../components/new_build_components/ReviewBuild";
import { DEFAULT_BUILD_DATA, type BuildData} from "../models/BuildData";

export default function CreateNew() {

    const [currentStep, setCurrentStep] =
        useState(1);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [buildData, setBuildData] =
        useState<BuildData>(DEFAULT_BUILD_DATA);

    async function handleCreateBuild() {

        try {
            setIsSubmitting(true);
            const response = await fetch(
                "http://localhost:8000/api/builds",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        buildData
                    )
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to create build"
                );
            }

            const result =
                await response.json();

            console.log(
                "Build created",
                result
            );

            setCurrentStep(4);
        }
        catch (error) {

            console.error(error);

            alert(
                "Failed to create build."
            );
        }
        finally {

            setIsSubmitting(false);
        }
    }

    function renderStep() {

        switch (currentStep) {

            case 1:
                return (
                    <OrderDetailsStep
                        buildData={buildData}
                        setBuildData={
                            setBuildData
                        }
                    />
                );

            case 2:
                return (
                    <RackSn
                        buildData={buildData}
                        setBuildData={
                            setBuildData
                        }
                    />
                );

            case 3:
                return (
                    <ReviewBuild
                        buildData={buildData}
                        onSubmit={
                            handleCreateBuild
                        }
                    />
                );

            case 4:
                return (
                    <Card>

                        <h2>
                            Build Created
                        </h2>

                        <p>
                            Order:
                            {" "}
                            {
                                buildData
                                    .orderDetails
                                    .buildId
                            }
                        </p>

                        <p>
                            The build was
                            successfully
                            created.
                        </p>

                        <p>
                            Next step:
                            populate
                            device and
                            component
                            serial
                            numbers.
                        </p>

                    </Card>
                );

            default:
                return null;
        }
    }

    return (

        <div className="create-build-container">

            <h1>
                Create New Build
            </h1>

            <div
                style={{
                    marginBottom: "20px"
                }}
            >
                Step {currentStep}
                {" / "}
                4

                <ProgressBar
                    value={
                        currentStep / 4
                    }
                />
            </div>

            {renderStep()}

            {
                currentStep <= 3 && (

                    <div
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            gap: "10px"
                        }}
                    >

                        {
                            currentStep > 1 && (

                                <Button
                                    onClick={() =>
                                        setCurrentStep(
                                            currentStep - 1
                                        )
                                    }
                                >
                                    Previous
                                </Button>
                            )
                        }

                        {
                            currentStep < 3 && (

                                <Button
                                    appearance="primary"
                                    onClick={() =>
                                        setCurrentStep(
                                            currentStep + 1
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            )
                        }

                        {
                            currentStep === 3 && (

                                <Button
                                    appearance="primary"
                                    onClick={
                                        handleCreateBuild
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                >
                                    {
                                        isSubmitting
                                            ? "Creating..."
                                            : "Create Build"
                                    }
                                </Button>
                            )
                        }

                    </div>
                )
            }

        </div>
    );
}