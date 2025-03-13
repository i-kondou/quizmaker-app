FROM node:22
WORKDIR /app_frontend

COPY /frontend_project/package*.json ./
RUN npm install

COPY /frontend_project/* ./
EXPOSE 5173

CMD ["npm", "run", "dev"]
