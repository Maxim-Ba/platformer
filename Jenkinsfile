pipeline {
  agent any

  environment {
    IMAGE = '3224142123/platformer'
    DEPLOY = 'platformer-frontend'
    NS = 'platformer'
    SITE_URL = 'https://platformer.balashov-maxim.ru'
  }

  stages {
    // Task 6.4: Pull (agent workspace) → Test (docker --target build: lint/test/build) →
    // Build → Push → Deploy. Push/Deploy MUST stay after Test/Build; not parallel with Test.
    stage('Pull Assets') {
      steps {
        // Args: Jenkins credentials id `minio-assets` (usernamePassword);
        //       `npm run assets:pull`; destination `public/assets/`.
        // Returns: runtime blobs restored into public/assets/ on the agent BEFORE
        //       Test `docker.build(..., '--target build .')` so maps/images are in
        //       the Docker build context. Do not implement withCredentials/sh here yet.
        withCredentials([
          usernamePassword(
            credentialsId: 'minio-assets',
            usernameVariable: 'MINIO_USER',
            passwordVariable: 'MINIO_PASS'
          )
        ]) {
          sh 'npm run assets:pull'
          sh 'test -d public/assets/'
        }
      }
    }

    stage('Assert World Graph Maps') {
      steps {
        // Args: WORLD_GRAPH room ids from src/game/world-graph.ts (room-a, room-b,
        //       room-c) — shell/node check after pull; do not import TypeScript from Jenkins.
        // Returns: success only if `public/assets/maps/{id}.json` exists for each id;
        //       otherwise fail the pipeline (MUST NOT reach Push/Deploy).
        sh '''
          test -f public/assets/maps/room-a.json
          test -f public/assets/maps/room-b.json
          test -f public/assets/maps/room-c.json
        '''
      }
    }

    stage('Test') {
      steps {
        script {
          // Jenkins is a container using the host docker.sock. Bind-mounting
          // $PWD would look up that path on the host (empty), not the workspace.
          docker.build("${IMAGE}:${GIT_COMMIT}-ci", '--target build .')
        }
      }
    }

    stage('Build') {
      steps {
        script {
          docker.build("${IMAGE}:${GIT_COMMIT}")
        }
      }
    }

    stage('Push') {
      steps {
        script {
          docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
            docker.image("${IMAGE}:${GIT_COMMIT}").push()
            docker.image("${IMAGE}:${GIT_COMMIT}").push('latest')
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        withKubeConfig([credentialsId: 'kubeconfig']) {
          sh """
            kubectl set image deployment/${DEPLOY} \
              ${DEPLOY}=${IMAGE}:${GIT_COMMIT} \
              -n ${NS}
            kubectl rollout status deployment/${DEPLOY} -n ${NS} --timeout=300s
          """
        }
      }
    }

    stage('Verify') {
      steps {
        sh 'curl -sf ${SITE_URL}/ -o /dev/null'
        // CONTRACT STEP VerifyMinIOMedia (task 6.3)
        // Args: SITE_URL (https://platformer.balashov-maxim.ru)
        // Returns: HTTP 200 from `curl -sfI ${SITE_URL}/media/assets/maps/level-01.json`
        //       in addition to the homepage GET above. Non-200 fails the pipeline.
        sh 'curl -sfI ${SITE_URL}/media/assets/maps/level-01.json -o /dev/null'
      }
    }
  }

  post {
    failure {
      echo 'Pipeline failed!'
    }
  }
}
