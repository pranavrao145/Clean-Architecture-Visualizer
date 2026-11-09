---
slug: /
title: API Home
---

# Getting Started with API Endpoints

## What is Cave?

Cave is a CLI (Command Line Interface) tool designed for CSC207 students to help structure, visualize, and verify clean architecture in their projects.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) version 20.0 or above
- A CSC207 project (or let Cave create one for you!)

## Before You Begin

The results of contacting these endpoints depends entirely on which directory you are in when the server is started.

## Endpoints

### `/api/template/generate/:language`

Accepted Request: POST

Initializes your CSC207 project with a sample clean architecture directory structure in the chosen programming language. The programming language is limited to 'python', 'java', 'javascript', and 'typescript'.

```
<language>  : The programming language of your project.
```

<details>
    <summary>The created structure should look like:</summary>

    ```
    src/
    ├── main/
    │   └── <language>/
    │       ├── app/
    │       ├── use_case/
    │       ├── entity/
    │       ├── interface_adapter/
    │       ├── data_access/
    │       └── view/
    └── test/
        └── <language>/
    ```

</details>

Run this first in your project folder. Cave will scaffold the recommended folder layout so you can start developing! These folders will not immediately be tracked by git as they are empty.

This will fail if there is no 'src' directory or if 'main' or 'test' are already generated.

### `/api/template/module_generate/:language`

Accepted Request: POST

Initializes your CSC207 project with a sample clean architecture directory structure in the chosen programming language, packaged by module. The programming language is limited to 'python', 'java', 'javascript', and 'typescript'.

```
<language>  : The programming language of your project.
```

<details>
    <summary>The created structure should look like:</summary>
    ```
    src/
    ├── main/
    │   └── <language>/
    │       ├── app/
    │       ├── entity/
    │       ├── features/
    │       ├── data_access/
    │       └── view/
    └── test/
        └── <language>/
    ```
</details>
Run this first in your project folder. Cave will scaffold the recommended folder layout so you can start developing! These folders will not immediately be tracked by git as they are empty.

This will fail if there is no 'src' directory or if 'main' or 'test' are already generated.

### `/api/template/add/:useCaseName`

Accepted Request: POST

Initializes the folders and file structure for a new use case, in a project packaged by layer.

```
<usecasename>   : The name of the new use case.
```

Replace `<usecasename>` with the name of your use case. The language of the files depends entirely on the name of the directory inside 'main', which is also the language passed in when initializing the project.

<details>
    <summary>
    Cave will generate the appropriate directories and boilerplate files following clean architecture conventions similar to the structure shown below:
    </summary>
    ```
    src/main/<language>/use_case/
    └── <usecasename>/
        ├── <usecasename>InputBoundary.<extension>
        ├── <usecasename>InputData.<extension>
        ├── <usecasename>Interactor.<extension>
        ├── <usecasename>OutputData.<extension>
        └── <usecasename>OutputBoundary.<extension>

    src/main/<language>/interface_adapter/
    └── <usecasename>/
        ├── <usecasename>Controller.<extension>
        └── <usecasename>Presenter.<extension>
    ```

</details>

In the example above:

```
<language>      <extension>
python          py
java            java
javascript      js
typescript      ts
```

This will fail if there is no project or if there already exists a use case of the same name.

### `/api/template/module_add/:featureName`

Accepted Request: POST

Initializes the folder for a new feature. This only works on projects packaged by module.

```
<featurename>   : The name of the new feature.
```

Replace `<featurename>` with the name of your feature. Cave will generate the appropriate directory as shown below:

```
src/main/<language>/features
└── <featurename>
```

This will fail if there is no project or if there already exists a feature of the same name.

### `/api/template/module_add/:featureName/:useCaseName`

Accepted Request: POST

Initializes the folders and file structure for a new use case, in the specified feature, in a project packaged by module.

```
<featurename>   : The name of the feature you want to add the use case to.
<usecasename>   : The name of the new use case.
```

Replace `<featurename>` with the name of your feature. Replace `<usecasename>` with the name of your use case. The language of the files depends entirely on the name of the directory inside 'main', which is also the language passed in when initializing the project.

<details>
    <summary>
    Cave will generate the appropriate directories and boilerplate files following clean architecture conventions similar to the structure shown below:
    </summary>
    ```
    src/main/<language>/features/<featurename>/use_case/
    └── <usecasename>/
        ├── <usecasename>InputBoundary.<extension>
        ├── <usecasename>InputData.<extension>
        ├── <usecasename>Interactor.<extension>
        ├── <usecasename>OutputData.<extension>
        └── <usecasename>OutputBoundary.<extension>

    src/main/<language>/features/<featurename>/interface_adapter/
    └── <usecasename>/
        ├── <usecasename>Controller.<extension>
        └── <usecasename>Presenter.<extension>
    ```

</details>

In the example above:

```
<language>      <extension>
python          py
java            java
javascript      js
typescript      ts
```

This will fail if there is no project or if the input feature does not exist or if there already exists a use case of the same name in the project.

### `/api/analysis/interaction/:id`

Accepted Request: GET

Gets information about the use case associated with id.

```
<id>    : The ID of the interaction (same as ID of use case).
```

The information returned includes the name of the use case, a list of node information, a list of edge information, and whether or not anything file imports the interactor (decoupling). For each node in the use case, there is an entry in the list of node information which includes the id of the node, its name (if it exist), what type of clean architecture node it is, what layer of clean architecture it belongs to, its file path, and its status ('VALID', 'MISSING', 'VIOLATION'). For each edge, there is an entry in the list of edge information which includes the id of the edge, the starting node, the target node, its type ('DEPENDENCY'), and its status ('VALID', 'INCORRECT_DEPENDENCY').

<details>
    <summary>Suppose the following was our project structure:</summary>
    ```
    my_project/src/main/java/use_case/
    └── usecase1/
        ├── usecase1InputBoundary.java
        ├── usecase1InputData.java
        ├── usecase1Interactor.java
        ├── usecase1OutputData.java
        └── usecase1OutputBoundary.java

    my_project/src/main/java/interface_adapter/
    └── usecase1/
        ├── usecase1Controller.java
        └── usecase1Presenter.java
    ```

</details>

Suppose the only file with any lines was 'usecase1Controller.java' and it contained the following:

```
import usecase1Presenter.java;
```

Upon contacting the following endpoint:

```
/analysis/interaction/uc-0
```

<details>
    <summary>The following is the expected result:</summary>

    ```
    {
        "interaction_name":"usecase1",
        "nodes":
        [
            {
                "id":"controller",
                "name":"Controller",
                "type":"controller",
                "layer":"interfaceAdapters",
                "file_path":"/my_project/src/main/java/interface_adapter/usecase1/usecase1Controller.java",
                "status":"VIOLATION"
            },
            {
                "id":"presenter",
                "name":"Presenter",
                "type":"presenter",
                "layer":"interfaceAdapters",
                "file_path":"/my_project/src/main/java/interface_adapter/usecase1/usecase1Presenter.java",
                "status":"VIOLATION"
            },
            {
                "id":"inputBoundary",
                "name":"Input Boundary",
                "type":"inputBoundary",
                "layer":"applicationBusinessRules",
                "file_path":"/my_project/src/main/java/use_case/usecase1/usecase1InputBoundary.java",
                "status":"VALID"
            },
            {
                "id":"inputData",
                "name":"Input Data",
                "type":"inputData",
                "layer":"applicationBusinessRules",
                "file_path":"/my_project/src/main/java/use_case/usecase1/usecase1InputData.java",
                "status":"VALID"
            },
            {
                "id":"outputBoundary",
                "name":"Output Boundary",
                "type":"outputBoundary",
                "layer":"applicationBusinessRules",
                "file_path":"/my_project/src/main/java/use_case/usecase1/usecase1OutputBoundary.java",
                "status":"VALID"
            },
            {
                "id":"outputData",
                "name":"Output Data",
                "type":"outputData",
                "layer":"applicationBusinessRules",
                "file_path":"/my_project/src/main/java/use_case/usecase1/usecase1OutputData.java","status":"VALID"
            },
            {
                "id":"useCaseInteractor",
                "name":"Use Case Interactor",
                "type":"useCaseInteractor",
                "layer":"applicationBusinessRules",
                "file_path":"/my_project/src/main/java/use_case/usecase1/usecase1UseCaseInteractor.java",
                "status":"VALID"
            },
            {
                "id":"viewModel",
                "name":"View Model (Missing)",
                "type":"viewModel",
                "layer":"interfaceAdapters",
                "status":"MISSING"
            },
            {
                "id":"view",
                "name":"View (Missing)",
                "type":"view",
                "layer":"frameworksAndDrivers",
                "status":"MISSING"
            },
            {
                "id":"dataAccess",
                "name":"Data Access (Missing)",
                "type":"dataAccess",
                "layer":"frameworksAndDrivers",
                "status":"MISSING"
            },
            {
                "id":"database",
                "name":"Database (Missing)",
                "type":"database",
                "layer":"frameworksAndDrivers",
                "status":"MISSING"
            },
            {
                "id":"entities",
                "name":"Entities (Missing)",
                "type":"entities",
                "layer":"enterpriseBusinessRules",
                "status":"MISSING"
            },
            {
                "id":"dataAccessInterface",
                "name":"Data Access Interface (Missing)",
                "type":"dataAccessInterface",
                "layer":"applicationBusinessRules",
                "status":"MISSING"
            }
        ],
        "edges":
        [
            {
                "id":"controller->presenter",
                "source":"controller",
                "target":"presenter",
                "type":"DEPENDENCY",
                "status":"INCORRECT_DEPENDENCY"
            }
        ],
        "decoupling":false
    }
    ```

</details>

### `/api/analysis/violations/:interactionId`

Accepted Request: GET

Gets information about all of the violations interaction ID.

```
<interactionId>     : The ID of the interaction (same as ID of use case).
```

The information returned is a list of all of the violations in a use case. Each entry includes the id of the violation, the type of violation, the message, the suggestion, a list containing nodes related to the violation, the id of the edge related to the violation, and file context. The file context includes the line number the violation occurs on and a snippet of what is on that line.

<details>
    <summary>Suppose the following was our project structure:</summary>

    ```
    my_project/src/main/java/use_case/
    └── usecase1/
        ├── usecase1InputBoundary.java
        ├── usecase1InputData.java
        ├── usecase1Interactor.java
        ├── usecase1OutputData.java
        └── usecase1OutputBoundary.java

    my_project/src/main/java/interface_adapter/
    └── usecase1/
        ├── usecase1Controller.java
        └── usecase1Presenter.java
    ```

</details>

Suppose the only file with any lines was 'usecase1Controller.java' and it contained the following:

```
import usecase1Presenter.java;
```

Upon contacting the following endpoint:

```
/api/analysis/violations/uc-0
```

<details>
    <summary>The following is the expected result:</summary>

    ```
    [
        {
            "id":"v-0",
            "type":"INCORRECT_DEPENDENCY",
            "message":"",
            "suggestion":"",
            "related_node_ids":
            [
                "/my_project/src/main/java/interface_adapter/usecase1/usecase1Controller.java-usecase1",
                "/my_project/src/main/java/interface_adapter/usecase1/usecase1Presenter.java-usecase1"
            ],
            "related_edge_id":"controller->presenter",
            "file_context":
            {
                "file":"usecase1Controller.java",
                "snippet":"import usecase1Presenter.java;",
                "line_number":1
            }
        }
    ]
    ```

</details>

### `/api/analysis/files-with-violations`

Accepted Request: GET

Get all files in the projects that have violations.

The information returned includes the number of files that are involved in violations and the file paths to those files.

<details>
    <summary>Suppose the following was our project structure:</summary>

    ```
    my_project/src/main/java/use_case/
    └── usecase1/
        ├── usecase1InputBoundary.java
        ├── usecase1InputData.java
        ├── usecase1Interactor.java
        ├── usecase1OutputData.java
        └── usecase1OutputBoundary.java

    my_project/src/main/java/interface_adapter/
    └── usecase1/
        ├── usecase1Controller.java
        └── usecase1Presenter.java
    ```

</details>

Suppose the only file with any lines was 'usecase1Controller.java' and it contained the following:

```
import usecase1Presenter.java;
```

Upon contacting the endpoint, the following is the expected result:

```
{
    "total_violations":2,
    "files":
    [
        "/my_project/src/main/java/interface_adapter/usecase1/usecase1Controller.java",
        "/my_project/src/main/java/interface_adapter/usecase1/usecase1Presenter.java"
    ]
}
```

### `/api/analysis/summary`

Accepted Request: GET

Gets information about the current project.

The information returned includes the name of the project, the number of use cases, the total number of violations, and information about all of the use cases. For each use case, you get the id, name, number of violations, and a list of interactions. The list of interactions includes one entry which includes the interaction id (id of use case) and the interaction name (name of use case).

<details>
    <summary>Suppose the following was our project structure:</summary>
    ```
    my_project/src/main/java/use_case/
    └── usecase1/
        ├── usecase1InputBoundary.java
        ├── usecase1InputData.java
        ├── usecase1Interactor.java
        ├── usecase1OutputData.java
        └── usecase1OutputBoundary.java

    my_project/src/main/java/interface_adapter/
    └── usecase1/
        ├── usecase1Controller.java
        └── usecase1Presenter.java
    ```

</details>

Suppose the only file with any lines was 'usecase1Controller.java' and it contained the following:

```
import usecase1Presenter.java;
```

<details>
    <summary>Upon contacting the endpoint, the following is the expected result:</summary>
    ```
    {
        "project_name":"my_project",
        "total_use_cases":1,
        "total_violations":1,
        "use_cases":
        [{
            "id":"uc-0",
            "name":"usecase1",
            "violation_count":1,
            "interactions":
            [{
                "interaction_id":"uc-0",
                "interaction_name":"usecase1"
            }]
        }]
    }
    ```
</details>

### `/api/design-patterns/analyze`

Accepted Request: POST

Analyses the Java code in the current project and detects the chosen design patterns. Each call runs a new analysis, so the response reflects the code as it is now.

The request body lists the patterns to detect. The only pattern available for now is 'singleton'.

```json
{
  "patternIds": ["singleton"]
}
```

`patternIds` is required. An empty list is allowed: you get the class diagram with no patterns detected.

The information returned is a UML class diagram of the project, plus the patterns found in it:

- `classes`: One entry for each class, interface, and enum. Each includes its fully qualified name (`fqn`), `name`, `kind` ('class', 'interface', 'enum'), its opening declaration (`codeText`), and its `members`. Each member includes its `fqn`, `kind` ('field', 'method', 'constant'), its UML notation (`umlText`), and its Java-like declaration (`codeText`).
- `relationships`: One entry for each arrow between two classes in the project. Each includes its `id`, `kind` ('extends', 'implements', 'association'), and the classes it runs between (`fromFqn`, `toFqn`). An 'association' means the first class has a field whose type is the second class. Classes from outside the project, such as `java.util.List`, get no arrow.
- `patternInstances`: One entry for each place a pattern was detected. Each includes its `id`, details of the pattern (`patternId`, `patternName`, `patternType`, `description`, `learningInfo`), and the classes and members that make it up (`classFqns`, `memberFqns`).

Classes, members, and relationships also each have a `patternInstanceIds` list, which holds the `id` of every detected instance they take part in. The list is empty for anything outside a detected pattern.

<details>
    <summary>Suppose the project contained a singleton `Logger` that extends a class called `Base`. The following is the expected result, shortened to the `Logger` class:</summary>

```json
{
  "classes": [
    {
      "fqn": "app.core.Logger",
      "name": "Logger",
      "kind": "class",
      "codeText": "public final class Logger {",
      "members": [
        {
          "fqn": "app.core.Logger.instance",
          "kind": "field",
          "umlText": "- instance: Logger {static}",
          "codeText": "private static Logger instance;",
          "patternInstanceIds": ["singleton-0"]
        },
        {
          "fqn": "app.core.Logger.getInstance()",
          "kind": "method",
          "umlText": "+ getInstance(): Logger {static}",
          "codeText": "public static Logger getInstance();",
          "patternInstanceIds": ["singleton-0"]
        },
        {
          "fqn": "app.core.Logger.area()",
          "kind": "method",
          "umlText": "+ area(): double",
          "codeText": "public double area();",
          "patternInstanceIds": []
        }
      ],
      "patternInstanceIds": ["singleton-0"]
    }
  ],
  "relationships": [
    {
      "id": "extends:app.core.Logger->app.core.Base",
      "kind": "extends",
      "fromFqn": "app.core.Logger",
      "toFqn": "app.core.Base",
      "patternInstanceIds": []
    }
  ],
  "patternInstances": [
    {
      "id": "singleton-0",
      "patternId": "singleton",
      "patternName": "Singleton",
      "patternType": "Design Pattern",
      "description": "Creational design pattern. Ensures a class has only one instance and provides a global point of access to it.",
      "learningInfo": "...",
      "classFqns": ["app.core.Logger"],
      "memberFqns": ["app.core.Logger.instance", "app.core.Logger.getInstance()"]
    }
  ]
}
```

</details>

The response has one of the statuses below. When a request fails, its body has one `error` message.

```
Status  Meaning                                                   Example error
200     The analysis ran, whether or not any patterns were found.
400     patternIds is missing or contains an unknown pattern.     Unknown pattern ID: strategy
500     The analysis could not run, such as when Java fails.      The message from the failure
```
