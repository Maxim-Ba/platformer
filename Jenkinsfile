pipeline {
  agent any

  environment {
    IMAGE = '3224142123/platformer'
    DEPLOY = 'platformer-frontend'
    NS = 'platformer'
    SITE_URL = 'https://platformer.balashov-maxim.ru'
    S3MANAGER_URL = 'https://minio-adminer.balashov-maxim.ru'
  }

  stages {
    // Task 6.4: Pull (agent workspace) → Test (docker --target build: lint/test/build) →
    // Build → Push → Deploy. Push/Deploy MUST stay after Test/Build; not parallel with Test.
    stage('Pull Assets') {
      steps {
        // Jenkins-in-Docker has docker but no Node (`npm: not found`).
        // docker.inside bind-mounts $PWD from the *host*. Copy the workspace
        // into a node container and run `npm run assets:pull` against
        // minio-adminer HTTPS (same s3manager host as the UI / assets:push).
        withCredentials([
          usernamePassword(
            credentialsId: 's3manager-http',
            usernameVariable: 'S3MANAGER_USER',
            passwordVariable: 'S3MANAGER_PASSWORD'
          )
        ]) {
          sh '''
            set -eu
            cid=$(docker create \
              -e S3MANAGER_URL \
              -e S3MANAGER_USER \
              -e S3MANAGER_PASSWORD \
              -e S3MANAGER_INSTANCE=Default \
              node:20-alpine sleep 3600)
            cleanup() { docker rm -f "$cid" >/dev/null 2>&1 || true; }
            trap cleanup EXIT
            docker start "$cid"
            docker exec "$cid" mkdir -p /app
            docker cp "$PWD/." "$cid":/app
            docker exec -w /app "$cid" sh -c "npm ci && npm run assets:pull"
            mkdir -p public/assets
            docker cp "$cid":/app/public/assets/. public/assets/
            test -d public/assets/
          '''
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
            kubectl apply -f k8s/minio/middleware.yaml
            kubectl apply -f k8s/ingress/ingress.yaml
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
        // SPA fallback on `/media` is HTTP 200 text/html — curl -sfI would pass.
        // Body must be Tiled JSON from MinIO, not frontend index.html.
        sh '''
          set -eu
          body=$(curl -sf "${SITE_URL}/media/assets/maps/level-01.json")
          printf '%s' "$body" | grep -qi '<!doctype html' && exit 1
          printf '%s' "$body" | grep -q '"tilesets"'
          printf '%s' "$body" | grep -q '"layers"'
        '''
      }
    }
  }

  post {
    failure {
      echo 'Pipeline failed!'
    }
  }
}
