# Usa a imagem oficial do Nginx como base
FROM nginx:alpine

# Remove o arquivo de configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia o arquivo de configuração customizado do Nginx para o contêiner
COPY nginx.conf /etc/nginx/conf.d/

# Copia os arquivos estáticos do frontend para o diretório de serviço do Nginx
COPY ../frontend /usr/share/nginx/html

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# Comando para iniciar o Nginx quando o contêiner for executado
CMD ["nginx", "-g", "daemon off;"]
