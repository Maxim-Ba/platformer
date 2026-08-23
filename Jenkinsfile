pipeline {
  agent any

  environment {
    IMAGE = '3224142123/platformer'
    DEPLOY = 'platformer-frontend'
    NS = 'platformer'
    SITE_URL = 'https://platformer.balashov-maxim.ru'
  }

  stages {
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
      }
    }
  }

  post {
    failure {
      echo 'Pipeline failed!'
    }
  }
}
