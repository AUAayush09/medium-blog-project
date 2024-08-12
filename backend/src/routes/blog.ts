import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@aayushau09/medium-commo_n"

export const bookRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        userId: string
    }
}>();

bookRouter.use("/*" , async (c, next) => {
    const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = c.req.header("authorization") || "";

	try{
			const payload = await verify(token, c.env.JWT_SECRET);
			if (payload) {
			//@ts-ignore
				c.set('userId', payload.id);
				await next()
				
			}else{
				c.status(401);
				return c.json({ message: "you are not logged in " });
	    }
	
	}catch(e){
		c.status(401);
		return c.json({ message: "you are not login " });
	}
	
});

bookRouter.post('/', async (c) => {
	
	const body = await c.req.json();
	const { success } = createBlogInput.safeParse(body);
	if(!success){
		c.status(411)
		return c.json({
			message: " input not correct"
		})
	}

	const userId = c.get('userId');

	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: (userId)
		}
	});
	return c.json({
		id: post.id
	});
})

bookRouter.put('/', async (c) => {
	// const userId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const { success } = updateBlogInput.safeParse(body);
	if(!success){
		c.status(411)
		return c.json({
			message: " input not correct"
		})
	}
	const blog = await prisma.post.update({
		where: {
			id: body.id,
			// authorId: userId
		},
		data: {
			title: body.title,
			content: body.content
		}
	});

	return c.json({
		id: blog.id
	})
});

bookRouter.get('/bulk', async (c) =>{
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const blogs = await prisma.post.findMany({
		select:{
			title: true,
			content: true,
       id: true,
			 author:{
				select:{
					name: true
				}
			 }
		}
	});
	return c.json({
		blogs
	})
})



bookRouter.get('/:id', async (c) => {
	const id = c.req.param("id");
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	try{
		//@ts-ignore
    const blog = await prisma.post.findFirst({
			where: {
				//@ts-ignore
				id: id
			},
			select: {
				id: true,
				title: true,
				content: true,
				author: {
						select: {
								name: true
						}
				}
		}
		});
	
		return c.json({
			blog
		});
	}catch(e){
		c.status(411)
		return c.json({
			message: "error while fetching blog post"
		});
	}
	
})
